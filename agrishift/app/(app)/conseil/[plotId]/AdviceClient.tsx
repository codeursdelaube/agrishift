"use client";

import { useParams } from "next/navigation";
import { useDeferredValue, useMemo, useState, type ReactNode } from "react";
import { RotationCard } from "@/components/advice/RotationCard";
import { DemoBanner, SourceBadge } from "@/components/badges/SourceBadge";
import { DryCloudIcon, SunIcon, ThermometerIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { ComingSoon, Skeleton } from "@/components/ui/ComingSoon";
import { recommend, ROTATION_DISCLAIMER } from "@/engine";
import { usePack, usePlot, usePlotSeasons, useProfile } from "@/lib/hooks";
import { t } from "@/lib/i18n";
import { seedAllPacks } from "@/lib/packs";
import { previousCropFor } from "@/lib/plots";

const A = t.advice;

const MAIN: { id: keyof typeof t.scenarios; icon: ReactNode }[] = [
  { id: "baseline", icon: <SunIcon size={28} /> },
  { id: "dry_minus20", icon: <DryCloudIcon size={28} /> },
  { id: "hot_plus2", icon: <ThermometerIcon size={28} /> },
  { id: "dry_hot", icon: <span className="flex"><DryCloudIcon size={24} /><ThermometerIcon size={24} /></span> },
];
const MORE: { id: keyof typeof t.scenarios; icon: ReactNode }[] = [
  { id: "dry_minus10", icon: <DryCloudIcon size={28} /> },
  { id: "dry_minus30", icon: <DryCloudIcon size={28} /> },
  { id: "hot_plus1", icon: <ThermometerIcon size={28} /> },
];

/** Top 3 des rotations + scénarios « Et si… ? », calculés sur le téléphone. */
export default function AdvicePage() {
  const { plotId } = useParams<{ plotId: string }>();
  const plot = usePlot(plotId);
  const seasons = usePlotSeasons(plotId);
  const profile = useProfile();
  const pack = usePack(plot?.zone_id);
  const [scenario, setScenario] = useState<keyof typeof t.scenarios>("baseline");
  const [showMore, setShowMore] = useState(false);
  const [horizon, setHorizon] = useState<number | null>(null);
  // Le sélecteur réagit tout de suite ; le calcul suit sans bloquer le toucher.
  const deferredScenario = useDeferredValue(scenario);

  const input = useMemo(
    () =>
      plot && seasons
        ? { zone_id: plot.zone_id, soil_id: plot.soil_id, previous_crop_id: previousCropFor(plot, seasons) }
        : null,
    [plot, seasons],
  );

  const result = useMemo(() => {
    if (!pack || !input || !profile) return null;
    try {
      return recommend(pack, input, profile.priority, deferredScenario, horizon);
    } catch {
      return null;
    }
  }, [pack, input, profile, deferredScenario, horizon]);

  if (plot === undefined || seasons === undefined || profile === undefined || pack === undefined) {
    return <Skeleton lines={4} />;
  }

  if (plot === null || plot.deleted || profile === null) {
    return (
      <ComingSoon icon={<SunIcon size={72} />} title={t.plot.notFound}>
        <Button href="/accueil">{t.common.backHome}</Button>
      </ComingSoon>
    );
  }

  if (pack === null || result === null || input === null) {
    return (
      <ComingSoon icon={<DryCloudIcon size={72} />} title={t.states.noPack} text={t.states.errorText}>
        <Button onClick={() => void seedAllPacks()}>{t.common.retry}</Button>
      </ComingSoon>
    );
  }

  const options = showMore ? [...MAIN, ...MORE] : MAIN;
  const selectedNote = pack.scenarios.find((s) => s.scenario_id === scenario)?.note_fr;
  const horizons = Array.from({ length: pack.scoring.horizon_max - 1 }, (_, i) => i + 2);
  const activeHorizon = horizon ?? pack.scoring.horizon_default;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">{A.title(plot.name)}</h1>
      {pack.climate.source_type === "synthetic_demo" ? <DemoBanner /> : null}

      <section aria-labelledby="whatif" className="flex flex-col gap-3">
        <h2 id="whatif" className="text-xl font-bold">{A.whatIf}</h2>
        <div role="radiogroup" aria-labelledby="whatif" className="flex flex-col gap-2">
          {options.map((o) => (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={scenario === o.id}
              onClick={() => setScenario(o.id)}
              className={`press flex min-h-14 items-center gap-3 rounded-box border-2 px-4 text-left font-bold ${
                scenario === o.id ? "border-primary bg-primary/10" : "border-base-300 bg-base-100"
              }`}
            >
              <span className="shrink-0 text-primary">{o.icon}</span>
              {t.scenarios[o.id]}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => setShowMore(!showMore)} className="btn btn-ghost min-h-12 h-auto self-start rounded-full">
          {showMore ? A.fewerChoices : A.moreChoices}
        </button>
        <p className="flex flex-wrap items-center gap-2 text-sm">
          <SourceBadge sourceType="synthetic_scenario" />
          <span>{selectedNote}</span>
        </p>
      </section>

      <section aria-labelledby="horizon" className="flex flex-col gap-3">
        <h2 id="horizon" className="text-xl font-bold">{A.horizon}</h2>
        <div role="radiogroup" aria-labelledby="horizon" className="grid grid-flow-col auto-cols-fr gap-2">
          {horizons.map((h) => (
            <button
              key={h}
              type="button"
              role="radio"
              aria-checked={activeHorizon === h}
              onClick={() => setHorizon(h)}
              className={`btn min-h-12 h-auto rounded-full ${activeHorizon === h ? "btn-primary" : "btn-outline"}`}
            >
              {A.horizonValue(h)}
            </button>
          ))}
        </div>
      </section>

      <section aria-labelledby="proposals" className="flex flex-col gap-4">
        <h2 id="proposals" className="text-2xl font-bold">{A.proposalsTitle}</h2>
        {result.recommendations.map((rec) => (
          <RotationCard
            key={rec.sequence.join("-")}
            rec={rec}
            pack={pack}
            plot={input}
            priority={profile.priority}
            detailHref={`/conseil/${plot.id}/detail?seq=${rec.sequence.join(",")}&scenario=${deferredScenario}`}
          />
        ))}
      </section>

      <div className="flex flex-col items-start gap-2 text-sm">
        <SourceBadge sourceType={pack.climate.source_type} sourceName={pack.climate.source_name} period={pack.climate.baseline_period} />
        <SourceBadge sourceType={result.source_type} />
        <p className="font-bold">{ROTATION_DISCLAIMER}</p>
        <p className="opacity-80">{A.reminder}</p>
      </div>
    </div>
  );
}
