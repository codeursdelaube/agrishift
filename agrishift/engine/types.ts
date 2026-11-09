/** Contrat du paquet de zone et des résultats du moteur (API_FRONTEND §4, §7). */

export type SourceType =
  | "nasa_power"
  | "public_historical_reanalysis"
  | "provisional_demo"
  | "synthetic_demo"
  | "synthetic_scenario"
  | "computed";

export type Priority = "food_security" | "drought_resilience" | "balanced";
export type Phase = "initial" | "development" | "mid" | "late";

export interface PackSeason {
  season_id: string;
  label_fr: string;
  sowing_dekad: number;
  sowing_source: SourceType;
  provisional_sowing_dekad: number;
  onset_dekad_clim: number | null;
}

export interface PackZone {
  zone_id: string;
  name_fr: string;
  region: string;
  latitude: number;
  longitude: number;
  elevation_m: number | null;
  seasons: PackSeason[];
  coordinate_note: string;
}

export interface ClimateDekad {
  dekad: number;
  label_fr: string;
  p_mm: number;
  p_p20: number | null;
  p_cv: number | null;
  et0_mm: number;
  tmean_c: number;
}

export interface ClimateTrend {
  baseline_period: string;
  recent_period: string;
  p_change_pct: number | null;
  t_change_c: number | null;
  note_fr: string;
}

export interface PackClimate {
  source_type: SourceType;
  source_name: string;
  baseline_period: string;
  units: Record<string, string>;
  dekads: ClimateDekad[];
  trend: ClimateTrend | null;
  warnings_fr: string[];
}

export interface Crop {
  crop_id: string;
  name_fr: string;
  family: string;
  n_fixing: boolean;
  cycle_days: number;
  water_need: string;
  drought_tolerance: string;
  food_staple: boolean;
  kc_ini: number;
  kc_mid: number;
  kc_end: number;
  root_depth_m: number;
  depletion_p: number;
  phases: Record<Phase, number>;
  source_type: SourceType;
  source_note?: string;
}

export interface Soil {
  soil_id: string;
  label_fr: string;
  taw_mm_per_m: number;
  source_type: SourceType;
  source_note?: string;
}

export interface RuleCondition {
  field: string;
  op: "eq" | "neq" | "lt" | "lte" | "gt" | "gte" | "in" | "eq_field";
  value: unknown;
}

export interface Rule {
  rule_id: string;
  effect: "bonus" | "penalty";
  delta: number;
  all: RuleCondition[];
  explanation_fr: string;
  source_type: SourceType;
  source_note?: string;
}

export interface Scenario {
  scenario_id: string;
  label_fr: string;
  rainfall_change_pct: number;
  temperature_change_c: number;
  source_type: SourceType;
  note_fr: string;
}

export interface Scoring {
  season_resilience_base: Record<Priority, number>;
  priority_bonus: Record<Priority, { food_staple: number; drought_level_factor: number }>;
  drought_levels: Record<string, number>;
  phase_weights: Record<Phase, number>;
  et0_temp_sensitivity_per_c: number;
  initial_soil_water_fraction: number;
  horizon_default: number;
  horizon_max: number;
  top_n: number;
  source_type: SourceType;
}

export interface Provenance {
  item: string;
  source_type: SourceType;
}

export interface ZonePack {
  schema_version: 1;
  pack_version: string;
  generated_at: string;
  zone: PackZone;
  climate: PackClimate;
  crops: Crop[];
  soils: Soil[];
  rules: Rule[];
  scenarios: Scenario[];
  scoring: Scoring;
  data_provenance: Provenance[];
}

export interface DekadStep {
  dekad: number;
  label_fr: string;
  phase: Phase;
  kc: number;
  p_mm: number;
  etc_mm: number;
  eta_mm: number;
  soil_water_mm: number;
  ks: number;
  stress: number;
}

export interface CriticalPeriod {
  from_label_fr: string;
  to_label_fr: string;
  phase: Phase;
  mean_stress: number;
}

export interface SimulationResult {
  crop_id: string;
  soil_id: string;
  scenario_id: string;
  sowing_dekad: number;
  harvest_dekad: number;
  stress_index: number;
  wrsi: number;
  dekads: DekadStep[];
  critical_periods: CriticalPeriod[];
  explanations_fr: string[];
  assumptions_fr: string[];
  source_type: SourceType;
  data_provenance: Provenance[];
  disclaimer_fr: string;
}

export interface RuleApplied {
  rule_id: string;
  delta: number;
  explanation_fr: string;
}

export interface SeasonResult {
  season_index: number;
  season_id: string;
  season_label_fr: string;
  sowing_dekad: number;
  crop_id: string;
  crop_name_fr: string;
  previous_crop_id: string | null;
  rules_applied: RuleApplied[];
  rule_points: number;
  resilience_points: number;
  priority_points: number;
  season_score: number;
  simulation: Pick<
    SimulationResult,
    "stress_index" | "wrsi" | "critical_periods" | "explanations_fr"
  >;
}

export interface Recommendation {
  rank: number | null;
  sequence: string[];
  sequence_names_fr: string[];
  total_score: number;
  mean_stress: number;
  seasons: SeasonResult[];
}

export interface PlotInput {
  zone_id: string;
  soil_id: string;
  previous_crop_id?: string | null;
}

export interface RotationResult {
  zone_id: string;
  soil_id: string;
  previous_crop_id: string | null;
  priority: Priority;
  scenario_id: string;
  horizon: number;
  n_sequences_evaluated: number;
  recommendations: Recommendation[];
  explanations_fr: string[];
  assumptions_fr: string[];
  source_type: SourceType;
  data_provenance: Provenance[];
  disclaimer_fr: string;
}
