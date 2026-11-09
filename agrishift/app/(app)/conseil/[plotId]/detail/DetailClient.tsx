"use client";

import { ArrowLeft } from "lucide-react";
import { useParams, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { RiskBadge } from "@/components/badges/RiskBadge";
import { SourceBadge } from "@/components/badges/SourceBadge";
import { SeasonWaterChart } from "@/components/charts/Charts";
import { SunIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { ComingSoon, Skeleton } from "@/components/ui/ComingSoon";
import { CropPhoto } from "@/components/ui/Photo";
import { evaluateSequence, simulate, SIMULATION_DISCLAIMER, ROTATION_DISCLAIMER, type DekadStep, type Phase, type ZonePack } from "@/engine";
import { friendlyDekad, n0 } from "@/lib/format";
import { usePack, usePlot, usePlotSeasons, useProfile } from "@/lib/hooks";
import { t } from "@/lib/i18n";
import { previousCropFor } from "@/lib/plots";
import { riskFromStress } from "@/lib/risk";

const A = t.advice;
const PHASES: Phase[] = ["initial", "development", "mid", "late"];

function PhaseLine({ steps }: { steps: DekadStep[] }) {
  const parts = PHASES.map((phase) => ({ phase, steps: steps.filter((s) => s.phase === phase) })).filter((p) => p.steps.length > 0);
  return (
    <ol className="flex overflow-hidden rounded-box text-sm">
      {parts.map((p, i) => (
        <li
          key={p.phase}
          style={{ flexGrow: p.steps.length, flexBasis: 0, opacity: 0.55 + i * 0.15 }}
          className="min-w-0 bg-primary px-2 py-2 text-primary-content"
        >
          <span className="block truncate font-bold">{A.phases[p.phase]}</span>
          <span className="block truncate text-xs">{friendlyDekad(p.steps[0].label_fr)}</span>
        </li>
      ))}
    </ol>
  );
}

function SeasonDetail({
  pack,
  cropId,
  cropName,
  label,
  soilId,
  scenarioId,
  sowing,
}: {
  pack: ZonePack;
  cropId: string;
  cropName: string;
  label: string;
  soilId: string;
  scenarioId: string;
  sowing: number;
}) {
  const sim = useMemo(() => simulate(pack, cropId, soilId, scenarioId, sowing), [pack, cropId, soilId, scenarioId, sowing]);
  const lacks = sim.critical_periods.map((p) =>
    A.waterLack(cropName, friendlyDekad(p.from_label_fr), friendlyDekad(p.to_label_fr), A.phases[p.phase]),
  );

  return (
    <section className="flex flex-col gap-4 rounded-box border border-base-300 p-4">
      <header className="flex items-center gap-3">
        <CropPhoto cropId={cropId} size={60} className="shrink-0" />
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-bold">{cropName}</h2>
          <p className="text-sm opacity-80">{label}</p>
        </div>
        <RiskBadge level={riskFromStress(sim.stress_index)} className="text-sm" />
      </header>

      <SeasonWaterChart steps={sim.dekads} title={`${A.chartRain} / ${A.chartNeed} — ${cropName}`} />

      <div>
        <h3 className="font-bold">{A.keepTitle}</h3>
        <p className="mt-1">{A.waterShare(n0(sim.wrsi))}</p>
        <progress className="progress progress-accent mt-2 h-3 w-full" value={sim.wrsi} max={100} aria-label={A.waterTitle} />
        {lacks.length > 0 ? (
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {lacks.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-2">{A.noStress}</p>
        )}
      </div>

      <div>
        <h3 className="mb-2 font-bold">{A.phasesTitle}</h3>
        <PhaseLine steps={sim.dekads} />
      </div>

      <details>
        <summary className="flex min-h-12 cursor-pointer items-center font-bold">{A.assumptionsTitle}</summary>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {sim.assumptions_fr.map((a) => (
            <li key={a}>{a}</li>
          ))}
          {pack.climate.warnings_fr.map((w) => (
            <li key={w}>{w}</li>
          ))}
          <li>{pack.zone.coordinate_note}</li>
        </ul>
        <p className="mt-2 text-sm font-bold">{SIMULATION_DISCLAIMER}</p>
      </details>
    </section>
  );
}

/** Détail d'une rotation, saison par saison (§9.7). */
export default function DetailClient() {
  const { plotId } = useParams<{ plotId: string }>();
  const search = useSearchParams();
  const sequence = useMemo(() => (search.get("seq") ?? "").split(",").filter(Boolean), [search]);
  const scenarioId = search.get("scenario") ?? "baseline";
  const plot = usePlot(plotId);
  const seasons = usePlotSeasons(plotId);
  const profile = useProfile();
  const pack = usePack(plot?.zone_id);

  const result = useMemo(() => {
    if (!pack || !plot || !seasons || !profile || sequence.length === 0) return null;
    try {
      return evaluateSequence(
        pack,
        { zone_id: plot.zone_id, soil_id: plot.soil_id, previous_crop_id: previousCropFor(plot, seasons) },
        profile.priority,
        scenarioId,
        sequence,
      );
    } catch {
      return null;
    }
  }, [pack, plot, seasons, profile, sequence, scenarioId]);

  if (plot === undefined || seasons === undefined || profile === undefined || pack === undefined) {
    return <Skeleton lines={4} />;
  }

  const back = (
    <Button href={`/conseil/${plotId}`} variant="ghost" icon={<ArrowLeft size={22} />}>
      {A.backToAdvice}
    </Button>
  );

  if (!result || !plot || !pack) {
    return (
      <ComingSoon icon={<SunIcon size={72} />} title={A.invalidLink}>
        {back}
      </ComingSoon>
    );
  }

  const rec = result.recommendations[0];
  const scenarioName = (t.scenarios as Record<string, string>)[scenarioId] ?? scenarioId;

  return (
    <div className="flex flex-col gap-5">
      <div className="-ml-3">{back}</div>
      <div>
        <h1 className="text-3xl font-bold">{A.detailTitle}</h1>
        <p className="mt-1 text-lg font-bold">{rec.sequence_names_fr.join(" → ")}</p>
        <p className="mt-2 flex flex-wrap items-center gap-2">
          <SourceBadge sourceType="synthetic_scenario" />
          <span>{scenarioName}</span>
        </p>
      </div>
      {rec.seasons.map((s, i) => (
        <SeasonDetail
          key={s.season_index}
          pack={pack}
          cropId={s.crop_id}
          cropName={s.crop_name_fr}
          label={`${A.season(i + 1)} · ${s.season_label_fr}`}
          soilId={plot.soil_id}
          scenarioId={scenarioId}
          sowing={s.sowing_dekad}
        />
      ))}
      <div className="flex flex-col items-start gap-2 text-sm">
        <SourceBadge sourceType={pack.climate.source_type} sourceName={pack.climate.source_name} period={pack.climate.baseline_period} />
        <SourceBadge sourceType={result.source_type} />
        <p className="font-bold">{ROTATION_DISCLAIMER}</p>
      </div>
    </div>
  );
}
