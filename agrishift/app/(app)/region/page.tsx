"use client";

import { MessagesSquare } from "lucide-react";
import { useEffect, useMemo } from "react";
import { DemoBanner, SourceBadge } from "@/components/badges/SourceBadge";
import { MonthlyRainChart } from "@/components/charts/Charts";
import { TrendCard } from "@/components/climate/TrendCard";
import { Button } from "@/components/ui/Button";
import { ComingSoon, Skeleton } from "@/components/ui/ComingSoon";
import { CropPhoto, PhotoHeader } from "@/components/ui/Photo";
import { TogoMap } from "@/components/illustrations/TogoMap";
import type { ZoneSummary } from "@/lib/api";
import { friendlyDekad, n0, n1, relativeFr } from "@/lib/format";
import { useOnline, usePack, useProfile, useSummary } from "@/lib/hooks";
import { t } from "@/lib/i18n";
import type { ImageKey } from "@/lib/images";
import { refreshSummary } from "@/lib/remote";
import { getZone, zoneFullName } from "@/lib/zones";

const R = t.region;

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-box bg-base-200 p-3">
      <p className="text-sm">{label}</p>
      <p className="text-xl leading-tight font-bold">{value}</p>
    </div>
  );
}

/** Ma région : climat depuis le paquet (hors ligne), agrégats depuis l'API. */
export default function RegionPage() {
  const profile = useProfile();
  const pack = usePack(profile?.zone_id);
  const cached = useSummary(profile?.zone_id);
  const online = useOnline();
  const zone = getZone(profile?.zone_id);

  useEffect(() => {
    if (zone && online) void refreshSummary(zone.zone_id).catch(() => {});
  }, [zone, online]);

  const monthly = useMemo(() => {
    const totals = Array.from({ length: 12 }, () => 0);
    pack?.climate.dekads.forEach((d) => {
      totals[Math.floor((d.dekad - 1) / 3)] += d.p_mm;
    });
    return totals;
  }, [pack]);

  const sowingMonths = useMemo(
    () => new Set(pack?.zone.seasons.map((s) => Math.floor((s.sowing_dekad - 1) / 3)) ?? []),
    [pack],
  );

  if (profile === undefined || pack === undefined || cached === undefined) return <Skeleton lines={5} />;

  if (!pack || !zone) {
    return <ComingSoon icon={<TogoMap title={R.title} className="h-48 w-auto text-base-content" />} title={t.states.noPack} />;
  }

  const summary = cached?.data as ZoneSummary | undefined;
  const annual = monthly.reduce((a, b) => a + b, 0);
  const meanTemp = pack.climate.dekads.reduce((a, d) => a + d.tmean_c, 0) / 36;
  const wettest = pack.climate.dekads.reduce((a, d) => (d.p_mm > a.p_mm ? d : a));
  const latest = summary?.producers.crops_by_season[0];
  const recent = summary?.recent_posts.slice(0, 3) ?? [];

  return (
    <div className="flex flex-col gap-6">
      <PhotoHeader image={zone.zone_id as ImageKey} title={R.title} subtitle={zoneFullName(zone)} />
      {pack.climate.source_type === "synthetic_demo" ? <DemoBanner /> : null}

      <div className="grid grid-cols-2 gap-2">
        <Stat label={R.annualRain} value={R.unitMm(n0(annual))} />
        <Stat label={R.meanTemp} value={R.unitC(n1(meanTemp))} />
        <div className="col-span-2">
          <Stat label={R.wettest} value={`${friendlyDekad(wettest.label_fr)} · ${R.unitMm(n0(wettest.p_mm))}`} />
        </div>
      </div>

      <section aria-labelledby="rain-title" className="flex flex-col gap-2">
        <h2 id="rain-title" className="text-2xl font-bold">{R.rainTitle}</h2>
        <MonthlyRainChart
          values={monthly}
          highlighted={sowingMonths}
          title={R.rainTitle}
          readout={R.rainMonth}
          hint={t.advice.chartHint}
        />
        <p className="text-sm">{R.rainLegend}</p>
        <SourceBadge sourceType={pack.climate.source_type} sourceName={pack.climate.source_name} period={pack.climate.baseline_period} />
      </section>

      <TrendCard pack={pack} />

      {summary ? (
        <section aria-labelledby="crops-title" className="flex flex-col gap-3">
          <h2 id="crops-title" className="text-2xl font-bold">{R.cropsTitle}</h2>
          {latest && latest.crops.some((c) => c.crop_id !== "other") ? (
            <ul className="flex flex-col gap-2">
              {latest.crops.map((c) => (
                <li key={c.crop_id} className="flex items-center gap-3 rounded-box bg-base-200 p-3">
                  <CropPhoto cropId={c.crop_id} size={44} className="shrink-0" />
                  <span className="flex-1 font-bold">{c.name_fr}</span>
                  <span>{R.plotsCount(c.n_plots)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-box bg-base-200 p-4">{R.cropsEmpty}</p>
          )}
          <p className="text-sm">{summary.producers.note_fr}</p>
          <p className="text-sm opacity-80">{R.updatedAt(relativeFr(cached!.fetched_at))}</p>
        </section>
      ) : null}

      {recent.length > 0 ? (
        <section aria-labelledby="recent-title" className="flex flex-col gap-3">
          <h2 id="recent-title" className="text-2xl font-bold">{R.recentTitle}</h2>
          <ul className="flex flex-col gap-2">
            {recent.map((p) => (
              <li key={p.id} className="rounded-box border border-base-300 p-3">
                <p className="text-sm font-bold">{p.author_name ?? t.exchanges.producerOf(zone.name_fr)}</p>
                <p className="wrap-break-word">{p.body}</p>
              </li>
            ))}
          </ul>
          <Button href="/echanges" variant="outline" block icon={<MessagesSquare size={22} />}>
            {R.seeAll}
          </Button>
        </section>
      ) : null}

      <section aria-labelledby="notes-title" className="text-sm">
        <h2 id="notes-title" className="font-bold">{R.notesTitle}</h2>
        <ul className="mt-1 list-disc space-y-1 pl-5">
          {pack.climate.warnings_fr.map((w) => (
            <li key={w}>{w}</li>
          ))}
          <li>{pack.zone.coordinate_note}</li>
        </ul>
      </section>
    </div>
  );
}
