/**
 * Moteur de calcul hors ligne (API_FRONTEND §4) : fonctions pures et déterministes,
 * sans DOM ni réseau. Doit donner les mêmes résultats que POST /simulate et /rotation/*.
 * On calcule en double précision et on n'arrondit jamais pendant le calcul.
 */
import type {
  CriticalPeriod,
  Crop,
  DekadStep,
  Phase,
  PlotInput,
  Priority,
  Provenance,
  Recommendation,
  RotationResult,
  Rule,
  RuleApplied,
  RuleCondition,
  Scenario,
  SeasonResult,
  SimulationResult,
  SourceType,
  ZonePack,
} from "./types";

export * from "./types";

export const SIMULATION_DISCLAIMER =
  "Simulation simplifiée à but d'aide à la réflexion ; ce n'est ni une prévision ni une estimation de rendement.";
export const ROTATION_DISCLAIMER = "Score logiciel de comparaison, pas un rendement estimé.";

const PHASES: readonly Phase[] = ["initial", "development", "mid", "late"];
const PHASE_FR: Record<Phase, string> = {
  initial: "levée",
  development: "croissance",
  mid: "floraison/remplissage",
  late: "maturation",
};

export class EngineError extends Error {
  constructor(
    public code: string,
    message_fr: string,
  ) {
    super(message_fr);
  }
}

/** Mise en forme des nombres dans les textes, au caractère près (§4.5). */
export function fmt(x: number, n = 2, signed = false): string {
  const k = 10 ** n;
  let v = Math.floor(x * k + 0.5) / k;
  if (v === 0) v = 0;
  let s = v.toFixed(n);
  if (n > 0) s = s.replace(/0+$/, "").replace(/\.$/, "");
  s = s.replace(".", ",");
  return signed && v >= 0 ? "+" + s : s;
}

function findCrop(pack: ZonePack, id: string): Crop {
  const crop = pack.crops.find((c) => c.crop_id === id);
  if (!crop) throw new EngineError("unknown_crop", `Culture inconnue : ${id}`);
  return crop;
}

function findSoil(pack: ZonePack, id: string) {
  const soil = pack.soils.find((s) => s.soil_id === id);
  if (!soil) throw new EngineError("unknown_soil", `Sol inconnu : ${id}`);
  return soil;
}

function findScenario(pack: ZonePack, id: string): Scenario {
  const scenario = pack.scenarios.find((s) => s.scenario_id === id);
  if (!scenario) throw new EngineError("unknown_scenario", `Scénario inconnu : ${id}`);
  return scenario;
}

/** Ordre de confiance (§4.6) : plus faible d'abord, à égalité ordre alphabétique. */
function strength(s: SourceType): number {
  if (s === "synthetic_demo") return 0;
  if (s === "provisional_demo") return 1;
  return 2;
}

function weakest(sources: SourceType[]): SourceType {
  return [...sources].sort((a, b) => strength(a) - strength(b) || (a < b ? -1 : a > b ? 1 : 0))[0];
}

function scenarioLine(s: Scenario): string {
  return `Scénario hypothétique : pluie ${fmt(s.rainfall_change_pct, 1, true)} %, température ${fmt(s.temperature_change_c, 1, true)} °C.`;
}

function phaseAt(phases: Crop["phases"], f: number): { phase: Phase; pos: number } {
  let start = 0;
  for (const phase of PHASES) {
    const end = start + phases[phase];
    if (end > f) return { phase, pos: (f - start) / (end - start) };
    start = end;
  }
  const lateStart = start - phases.late;
  return { phase: "late", pos: (f - lateStart) / (start - lateStart) };
}

function kcAt(crop: Crop, phase: Phase, pos: number): number {
  if (phase === "initial") return crop.kc_ini;
  if (phase === "development") return crop.kc_ini + (crop.kc_mid - crop.kc_ini) * pos;
  if (phase === "mid") return crop.kc_mid;
  return crop.kc_mid + (crop.kc_end - crop.kc_mid) * pos;
}

function criticalPeriods(steps: DekadStep[]): CriticalPeriod[] {
  const periods: CriticalPeriod[] = [];
  let run: DekadStep[] = [];
  const flush = () => {
    if (run.length === 0) return;
    periods.push({
      from_label_fr: run[0].label_fr,
      to_label_fr: run[run.length - 1].label_fr,
      phase: run[0].phase,
      mean_stress: run.reduce((sum, s) => sum + s.stress, 0) / run.length,
    });
    run = [];
  };
  for (const step of steps) {
    if (step.stress > 0.2) {
      if (run.length > 0 && run[0].phase !== step.phase) flush();
      run.push(step);
    } else {
      flush();
    }
  }
  flush();
  return periods;
}

function commonAssumptions(pack: ZonePack): { before: string[]; climate: string[] } {
  const sens = pack.scoring.et0_temp_sensitivity_per_c;
  return {
    before:
      pack.climate.source_type === "synthetic_demo"
        ? ["DONNÉES SYNTHÉTIQUES — TEST UNIQUEMENT : le climat utilisé est fictif."]
        : [],
    climate: [
      `Climat moyen ${pack.climate.baseline_period} par décade (${pack.climate.source_name}), pas la météo d'une année précise.`,
      `Sensibilité de l'ET0 à la température : ${fmt(sens * 100, 1)} % par °C.`,
      "Pas de ruissellement ni de drainage modélisés : la pluie remplit la réserve du sol, le surplus au-delà de la réserve est perdu.",
    ],
  };
}

const PROVISIONAL = "Paramètres de cultures, de sols et de règles provisoires, à valider par un agronome.";
const RICE_NOTE = "Riz traité en culture pluviale (ni irrigation ni submersion).";

/** Bilan hydrique d'une culture sur un sol, dans un scénario (§4.3). */
export function simulate(
  pack: ZonePack,
  cropId: string,
  soilId: string,
  scenarioId: string,
  sowingDekad?: number | null,
): SimulationResult {
  const crop = findCrop(pack, cropId);
  const soil = findSoil(pack, soilId);
  const scenario = findScenario(pack, scenarioId);
  const sowing = sowingDekad ?? pack.zone.seasons[0].sowing_dekad;
  if (!Number.isInteger(sowing) || sowing < 1 || sowing > 36) {
    throw new EngineError("invalid_sowing_dekad", `Décade de semis invalide : ${sowing} (1 à 36)`);
  }

  const { scoring, climate } = pack;
  const n = Math.ceil(crop.cycle_days / 10);
  const taw = soil.taw_mm_per_m * crop.root_depth_m;
  const threshold = (1 - crop.depletion_p) * taw;
  let sw = scoring.initial_soil_water_fraction * taw;

  const dekads: DekadStep[] = [];
  let weighted = 0;
  let weights = 0;
  let sumEta = 0;
  let sumEtc = 0;
  let last = sowing;

  for (let i = 0; i < n; i++) {
    const d = ((sowing + i - 1) % 36) + 1;
    last = d;
    const c = climate.dekads.find((x) => x.dekad === d);
    if (!c) throw new EngineError("invalid_pack", `Décade absente du paquet : ${d}`);
    const { phase, pos } = phaseAt(crop.phases, (i + 0.5) / n);
    const kc = kcAt(crop, phase, pos);
    const p = c.p_mm * (1 + scenario.rainfall_change_pct / 100);
    const etc = kc * c.et0_mm * (1 + scoring.et0_temp_sensitivity_per_c * scenario.temperature_change_c);
    const ks = sw >= threshold ? 1 : Math.min(1, Math.max(0, sw / threshold));
    const eta = ks * etc;
    sw = Math.min(taw, Math.max(0, sw + p - eta));
    const stress = 1 - ks;
    dekads.push({
      dekad: d,
      label_fr: c.label_fr,
      phase,
      kc,
      p_mm: p,
      etc_mm: etc,
      eta_mm: eta,
      soil_water_mm: sw,
      ks,
      stress,
    });
    const w = scoring.phase_weights[phase];
    weighted += w * stress;
    weights += w;
    sumEta += eta;
    sumEtc += etc;
  }

  const stressIndex = weighted / weights;
  const wrsi = sumEtc <= 0 ? 100 : Math.min(100, Math.max(0, (100 * sumEta) / sumEtc));
  const critical = criticalPeriods(dekads);

  const fraction = scoring.initial_soil_water_fraction;
  const common = commonAssumptions(pack);

  const provenance: Provenance[] = [
    { item: "climate", source_type: climate.source_type },
    { item: "crops", source_type: crop.source_type },
    { item: "soils", source_type: soil.source_type },
    { item: "scenario", source_type: scenario.source_type },
  ];

  return {
    crop_id: crop.crop_id,
    soil_id: soil.soil_id,
    scenario_id: scenario.scenario_id,
    sowing_dekad: sowing,
    harvest_dekad: last,
    stress_index: stressIndex,
    wrsi,
    dekads,
    critical_periods: critical,
    explanations_fr: [
      scenarioLine(scenario),
      ...(critical.length > 0
        ? critical.map(
            (p) =>
              `${crop.name_fr} : manque d'eau en ${PHASE_FR[p.phase]} (${p.from_label_fr} → ${p.to_label_fr}), stress moyen ${fmt(p.mean_stress, 2)}.`,
          )
        : ["Pas de manque d'eau marqué sur le cycle dans ce scénario."]),
      `Besoins en eau couverts à ${fmt(wrsi, 0)} %.`,
    ],
    assumptions_fr: [
      ...common.before,
      ...common.climate,
      `Réserve utile du sol : ${fmt(taw, 0)} mm (${soil.label_fr}, enracinement ${fmt(crop.root_depth_m, 2)} m), remplie à ${fmt(fraction * 100, 0)} % au semis.`,
      PROVISIONAL,
      ...(crop.crop_id === "rice" ? [RICE_NOTE] : []),
    ],
    source_type: weakest([climate.source_type, crop.source_type, soil.source_type]),
    data_provenance: provenance,
    disclaimer_fr: SIMULATION_DISCLAIMER,
  };
}

type RuleContext = { prev?: Crop; next: Crop; scenario: Scenario };

function getPath(ctx: RuleContext, path: string): unknown {
  let current: unknown = ctx;
  for (const key of path.split(".")) {
    if (current === null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

function compare(left: unknown, right: unknown, test: (order: number) => boolean): boolean {
  if (typeof left === "number" && typeof right === "number") return test(left - right);
  if (typeof left === "string" && typeof right === "string") {
    return test(left < right ? -1 : left > right ? 1 : 0);
  }
  return false;
}

function conditionHolds(c: RuleCondition, ctx: RuleContext): boolean {
  const left = getPath(ctx, c.field);
  if (left === undefined) return false;
  switch (c.op) {
    case "eq":
      return left === c.value;
    case "neq":
      return left !== c.value;
    case "lt":
      return compare(left, c.value, (o) => o < 0);
    case "lte":
      return compare(left, c.value, (o) => o <= 0);
    case "gt":
      return compare(left, c.value, (o) => o > 0);
    case "gte":
      return compare(left, c.value, (o) => o >= 0);
    case "in":
      return Array.isArray(c.value) && c.value.includes(left);
    case "eq_field": {
      const right = getPath(ctx, String(c.value));
      return right !== undefined && left === right;
    }
  }
}

export function evaluateRules(
  prev: Crop | undefined,
  next: Crop,
  scenario: Scenario,
  rules: Rule[],
): RuleApplied[] {
  const ctx: RuleContext = { prev, next, scenario };
  return rules
    .filter((r) => r.all.every((c) => conditionHolds(c, ctx)))
    .map((r) => ({ rule_id: r.rule_id, delta: r.delta, explanation_fr: r.explanation_fr }));
}

function validPriority(pack: ZonePack, priority: Priority) {
  if (!(priority in pack.scoring.priority_bonus)) {
    throw new EngineError("invalid_priority", `Priorité inconnue : ${priority}`);
  }
}

function resolveHorizon(pack: ZonePack, horizon?: number | null): number {
  const h = horizon ?? pack.scoring.horizon_default;
  if (!Number.isInteger(h) || h < 2 || h > pack.scoring.horizon_max) {
    throw new EngineError("invalid_horizon", `Horizon invalide : ${h} (entre 2 et ${pack.scoring.horizon_max} saisons)`);
  }
  return h;
}

type Simulator = (cropId: string, sowing: number) => SimulationResult;

function memoSimulator(pack: ZonePack, soilId: string, scenarioId: string): Simulator {
  const cache = new Map<string, SimulationResult>();
  return (cropId, sowing) => {
    const key = `${cropId}|${sowing}`;
    let result = cache.get(key);
    if (!result) {
      result = simulate(pack, cropId, soilId, scenarioId, sowing);
      cache.set(key, result);
    }
    return result;
  };
}

function scoreSequence(
  pack: ZonePack,
  sequence: string[],
  previousCropId: string | null,
  priority: Priority,
  scenario: Scenario,
  sim: Simulator,
): Omit<Recommendation, "rank"> {
  const { scoring, zone } = pack;
  const bonus = scoring.priority_bonus[priority];
  const seasons: SeasonResult[] = [];
  let previous = previousCropId;
  let total = 0;
  let stressSum = 0;

  sequence.forEach((cropId, k) => {
    const season = zone.seasons[k % zone.seasons.length];
    const crop = findCrop(pack, cropId);
    const prev = previous === null ? undefined : findCrop(pack, previous);
    const rules = evaluateRules(prev, crop, scenario, pack.rules);
    const rulePoints = rules.reduce((sum, r) => sum + r.delta, 0);
    const result = sim(cropId, season.sowing_dekad);
    const resiliencePoints = scoring.season_resilience_base[priority] * (1 - result.stress_index);
    const priorityPoints =
      bonus.food_staple * (crop.food_staple ? 1 : 0) +
      bonus.drought_level_factor * scoring.drought_levels[crop.drought_tolerance];
    const seasonScore = rulePoints + resiliencePoints + priorityPoints;
    seasons.push({
      season_index: k,
      season_id: season.season_id,
      season_label_fr: season.label_fr,
      sowing_dekad: season.sowing_dekad,
      crop_id: crop.crop_id,
      crop_name_fr: crop.name_fr,
      previous_crop_id: previous,
      rules_applied: rules,
      rule_points: rulePoints,
      resilience_points: resiliencePoints,
      priority_points: priorityPoints,
      season_score: seasonScore,
      simulation: {
        stress_index: result.stress_index,
        wrsi: result.wrsi,
        critical_periods: result.critical_periods,
        explanations_fr: result.explanations_fr,
      },
    });
    total += seasonScore;
    stressSum += result.stress_index;
    previous = cropId;
  });

  return {
    sequence,
    sequence_names_fr: seasons.map((s) => s.crop_name_fr),
    total_score: total,
    mean_stress: stressSum / sequence.length,
    seasons,
  };
}

function compareSequences(a: Omit<Recommendation, "rank">, b: Omit<Recommendation, "rank">): number {
  if (a.total_score !== b.total_score) return b.total_score - a.total_score;
  if (a.mean_stress !== b.mean_stress) return a.mean_stress - b.mean_stress;
  for (let i = 0; i < a.sequence.length; i++) {
    if (a.sequence[i] !== b.sequence[i]) return a.sequence[i] < b.sequence[i] ? -1 : 1;
  }
  return 0;
}

function allSequences(ids: string[], length: number): string[][] {
  let out: string[][] = [[]];
  for (let i = 0; i < length; i++) {
    out = out.flatMap((prefix) => ids.map((id) => [...prefix, id]));
  }
  return out;
}

const SEASON_ASSUMPTION =
  "Une culture par saison ; la saison k utilise le calendrier de semis de la zone (alternance grande/petite saison si la zone en a deux).";

function rotationEnvelope(
  pack: ZonePack,
  plot: PlotInput,
  priority: Priority,
  scenario: Scenario,
  usedCrops: Crop[],
): Pick<
  RotationResult,
  | "zone_id"
  | "soil_id"
  | "previous_crop_id"
  | "priority"
  | "scenario_id"
  | "explanations_fr"
  | "assumptions_fr"
  | "source_type"
  | "data_provenance"
  | "disclaimer_fr"
> {
  const soil = findSoil(pack, plot.soil_id);
  const common = commonAssumptions(pack);
  const cropsSource = weakest(usedCrops.map((c) => c.source_type));
  const rulesSource = weakest(pack.rules.map((r) => r.source_type));
  return {
    zone_id: plot.zone_id,
    soil_id: plot.soil_id,
    previous_crop_id: plot.previous_crop_id ?? null,
    priority,
    scenario_id: scenario.scenario_id,
    explanations_fr: [scenarioLine(scenario)],
    assumptions_fr: [
      ...common.before,
      ...common.climate,
      SEASON_ASSUMPTION,
      PROVISIONAL,
      ...(usedCrops.some((c) => c.crop_id === "rice") ? [RICE_NOTE] : []),
    ],
    source_type: weakest([pack.climate.source_type, cropsSource, soil.source_type, rulesSource]),
    data_provenance: [
      { item: "climate", source_type: pack.climate.source_type },
      { item: "crops", source_type: cropsSource },
      { item: "soils", source_type: soil.source_type },
      { item: "rules", source_type: rulesSource },
      { item: "scoring", source_type: pack.scoring.source_type },
      { item: "scenario", source_type: scenario.source_type },
    ],
    disclaimer_fr: ROTATION_DISCLAIMER,
  };
}

function checkPlot(pack: ZonePack, plot: PlotInput, priority: Priority) {
  if (plot.zone_id !== pack.zone.zone_id) {
    throw new EngineError("zone_mismatch", `Le paquet ne correspond pas à la zone ${plot.zone_id}`);
  }
  validPriority(pack, priority);
  if (plot.previous_crop_id != null) findCrop(pack, plot.previous_crop_id);
  findSoil(pack, plot.soil_id);
}

/** Les meilleures rotations d'une parcelle (§4.4). */
export function recommend(
  pack: ZonePack,
  plot: PlotInput,
  priority: Priority,
  scenarioId: string,
  horizon?: number | null,
): RotationResult {
  checkPlot(pack, plot, priority);
  const scenario = findScenario(pack, scenarioId);
  const h = resolveHorizon(pack, horizon);
  const sim = memoSimulator(pack, plot.soil_id, scenarioId);
  const sequences = allSequences(
    pack.crops.map((c) => c.crop_id),
    h,
  );
  const ranked = sequences
    .map((seq) => scoreSequence(pack, seq, plot.previous_crop_id ?? null, priority, scenario, sim))
    .sort(compareSequences)
    .slice(0, pack.scoring.top_n)
    .map((r, i) => ({ rank: i + 1, ...r }));

  return {
    ...rotationEnvelope(pack, plot, priority, scenario, pack.crops),
    horizon: h,
    n_sequences_evaluated: sequences.length,
    recommendations: ranked,
  };
}

/** Une rotation pour chaque scénario demandé (§2.18). */
export function compareScenarios(
  pack: ZonePack,
  plot: PlotInput,
  priority: Priority,
  scenarioIds: string[],
  horizon?: number | null,
): RotationResult[] {
  return scenarioIds.map((id) => recommend(pack, plot, priority, id, horizon));
}

/** Note une séquence donnée avec la logique de recommend (§4.4). */
export function evaluateSequence(
  pack: ZonePack,
  plot: PlotInput,
  priority: Priority,
  scenarioId: string,
  sequence: string[],
): RotationResult {
  checkPlot(pack, plot, priority);
  const scenario = findScenario(pack, scenarioId);
  const used = [
    ...new Set([...(plot.previous_crop_id != null ? [plot.previous_crop_id] : []), ...sequence]),
  ].map((id) => findCrop(pack, id));
  const sim = memoSimulator(pack, plot.soil_id, scenarioId);
  const scored = scoreSequence(pack, sequence, plot.previous_crop_id ?? null, priority, scenario, sim);
  return {
    ...rotationEnvelope(pack, plot, priority, scenario, used),
    horizon: sequence.length,
    n_sequences_evaluated: 1,
    recommendations: [{ rank: null, ...scored }],
  };
}
