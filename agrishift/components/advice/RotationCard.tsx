"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { RiskBadge } from "@/components/badges/RiskBadge";
import { CropPhoto } from "@/components/ui/Photo";
import { ListenButton } from "@/components/ui/ListenButton";
import { evaluateSequence, type PlotInput, type Priority, type Recommendation, type SeasonResult, type ZonePack } from "@/engine";
import { friendlyDekad } from "@/lib/format";
import { t } from "@/lib/i18n";
import { riskFromStress } from "@/lib/risk";

const A = t.advice;
const COMPARED = ["baseline", "dry_minus20", "hot_plus2", "dry_hot"] as const;

function waterSentences(season: SeasonResult): string[] {
  return season.simulation.critical_periods.map((p) =>
    A.waterLack(season.crop_name_fr, friendlyDekad(p.from_label_fr), friendlyDekad(p.to_label_fr), A.phases[p.phase]),
  );
}

export function RotationCard({
  rec,
  pack,
  plot,
  priority,
  detailHref,
}: {
  rec: Recommendation;
  pack: ZonePack;
  plot: PlotInput;
  priority: Priority;
  detailHref: string;
}) {
  const [open, setOpen] = useState(false);
  const water = rec.seasons.flatMap(waterSentences);
  const summary = water[0] ?? rec.seasons.flatMap((s) => s.rules_applied)[0]?.explanation_fr ?? A.noStress;
  const rules = [...new Set(rec.seasons.flatMap((s) => s.rules_applied.map((r) => r.explanation_fr)))];

  // Calculé seulement à l'ouverture : la carte reste légère.
  const comparison = useMemo(() => {
    if (!open) return [];
    return COMPARED.map((id) => {
      const seasons = evaluateSequence(pack, plot, priority, id, rec.sequence).recommendations[0].seasons;
      return { id, risk: riskFromStress(Math.max(...seasons.map((s) => s.simulation.stress_index))) };
    });
  }, [open, pack, plot, priority, rec.sequence]);

  const spoken = `${A.rank(rec.rank ?? 1)}. ${rec.sequence_names_fr.join(", puis ")}. ${summary}`;

  return (
    <article className="flex flex-col gap-4 rounded-box border border-base-300 bg-base-100 p-4 shadow-sm">
      <h3 className="text-sm font-bold uppercase tracking-wide text-secondary">{A.rank(rec.rank ?? 1)}</h3>

      <ol className="flex flex-col gap-3">
        {rec.seasons.map((s, i) => (
          <li key={s.season_index} className="flex items-center gap-3">
            <CropPhoto cropId={s.crop_id} size={52} className="shrink-0" />
            <span className="min-w-0 flex-1">
              <span className="block text-lg leading-tight font-bold">{s.crop_name_fr}</span>
              <span className="block text-sm leading-tight opacity-80">
                {A.season(i + 1)} · {s.season_label_fr}
              </span>
            </span>
            <RiskBadge level={riskFromStress(s.simulation.stress_index)} className="text-sm" />
          </li>
        ))}
      </ol>

      <p className="text-lg">{summary}</p>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          className="btn btn-outline min-h-12 h-auto rounded-full px-5"
        >
          {t.common.why}
        </button>
        <ListenButton text={spoken} />
      </div>

      {open ? (
        <div className="page-in flex flex-col gap-4 rounded-box bg-base-200 p-4">
          {water.length > 0 ? (
            <div>
              <h4 className="font-bold">{A.waterTitle}</h4>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                {water.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p>{A.noStress}</p>
          )}
          {rules.length > 0 ? (
            <div>
              <h4 className="font-bold">{A.rulesTitle}</h4>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                {rules.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <div>
            <h4 className="font-bold">{A.compareTitle}</h4>
            <table className="mt-1 w-full">
              <thead className="sr-only">
                <tr>
                  <th>{A.compareScenario}</th>
                  <th>{A.compareRisk}</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((c) => (
                  <tr key={c.id} className="border-t border-base-300">
                    <td className="py-2 pr-2">{t.scenarios[c.id]}</td>
                    <td className="py-2 text-right">
                      <RiskBadge level={c.risk} className="text-sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <Link href={detailHref} className="inline-flex min-h-12 items-center gap-1 self-start font-bold text-primary">
        {t.common.seeDetail}
        <ChevronRight aria-hidden="true" size={22} />
      </Link>
    </article>
  );
}
