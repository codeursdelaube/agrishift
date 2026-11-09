import { SourceBadge } from "@/components/badges/SourceBadge";
import type { ZonePack } from "@/engine/types";
import { n0, n1 } from "@/lib/format";
import { t } from "@/lib/i18n";

const W = t.weather;

/** Constat historique sur le climat de la zone, jamais présenté comme une prévision. */
export function TrendCard({ pack }: { pack: ZonePack }) {
  const trend = pack.climate.trend;
  if (!trend) return null;
  const rain = trend.p_change_pct;
  const temp = trend.t_change_c;
  return (
    <section className="flex flex-col gap-2 rounded-box bg-base-200 p-4">
      <h2 className="text-xl font-bold">{W.trendTitle}</h2>
      {rain !== null ? (
        <p>{W.trendRain(pack.zone.name_fr, trend.recent_period, trend.baseline_period, n0(Math.abs(rain)), rain < 0)}</p>
      ) : null}
      {temp !== null ? <p>{W.trendTemp(n1(Math.abs(temp)), temp < 0)}</p> : null}
      <p className="font-bold">{trend.note_fr}</p>
      <SourceBadge sourceType={pack.climate.source_type} sourceName={pack.climate.source_name} period={pack.climate.baseline_period} />
    </section>
  );
}
