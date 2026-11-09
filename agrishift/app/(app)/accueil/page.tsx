"use client";

import { CloudSun, MapPin, Plus, Sprout } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { SourceBadge } from "@/components/badges/SourceBadge";
import { PlotCard } from "@/components/plots/PlotCard";
import { Button } from "@/components/ui/Button";
import { ComingSoon, Skeleton } from "@/components/ui/ComingSoon";
import { CropPhoto, PhotoHeader } from "@/components/ui/Photo";
import { dekadLabel, dekadOf, n0 } from "@/lib/format";
import { useForecast, usePack, usePlots, useProfile } from "@/lib/hooks";
import { t } from "@/lib/i18n";
import type { ImageKey } from "@/lib/images";
import type { Forecast } from "@/lib/remote";
import { refreshForecast } from "@/lib/remote";
import { getZone, zoneFullName } from "@/lib/zones";

const H = t.home;

/** Mon champ : page personnelle (§9.4). */
export default function HomePage() {
  const profile = useProfile();
  const plots = usePlots();
  const pack = usePack(profile?.zone_id);
  const forecast = useForecast(profile?.zone_id);
  const zone = getZone(profile?.zone_id);

  useEffect(() => {
    if (zone) void refreshForecast(zone.zone_id, zone.latitude, zone.longitude).catch(() => {});
  }, [zone]);

  if (profile === undefined || plots === undefined) return <Skeleton lines={4} />;

  if (profile === null) {
    return (
      <ComingSoon icon={<MapPin size={64} aria-hidden="true" />} title={H.notSetUp}>
        <Button href="/demarrer" size="lg">
          {t.landing.start}
        </Button>
      </ComingSoon>
    );
  }

  const season = pack?.zone.seasons[0];
  const normal = pack?.climate.dekads.find((d) => d.dekad === dekadOf(new Date()));
  const daily = (forecast?.data as Forecast | undefined)?.daily;
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Lome" });
  const todayIndex = daily?.time.indexOf(today) ?? -1;
  const weatherLine =
    daily && todayIndex >= 0
      ? H.weatherToday(n0(daily.precipitation_sum[todayIndex] ?? 0), n0(daily.temperature_2m_max[todayIndex] ?? 0))
      : normal
        ? H.weatherNormal(n0(normal.p_mm))
        : "";

  return (
    <div className="flex flex-col gap-6">
      <PhotoHeader
        image={(zone?.zone_id ?? "hero") as ImageKey}
        title={H.hello(profile.display_name)}
        subtitle={zone ? H.zoneLine(zoneFullName(zone)) : undefined}
      />

      {pack?.climate.source_type === "synthetic_demo" ? <SourceBadge sourceType="synthetic_demo" /> : null}
      {season && zone ? (
        <p className="text-lg">
          {H.seasonLine(zone.name_fr, season.label_fr, dekadLabel(season.onset_dekad_clim ?? season.sowing_dekad))}
        </p>
      ) : null}

      {/* Action principale */}
      <Link
        href="/conseil"
        className="press flex items-center gap-4 rounded-box bg-primary p-5 text-primary-content shadow-md"
      >
        <Sprout aria-hidden="true" size={48} strokeWidth={2} className="shrink-0" />
        <span className="flex-1">
          <span className="block text-2xl font-bold">{H.adviceTitle}</span>
          <span className="block text-lg">{H.adviceText}</span>
        </span>
        <span aria-hidden="true" className="hidden -space-x-3 min-[420px]:flex">
          <CropPhoto cropId="maize" size={44} className="border-2 border-primary" />
          <CropPhoto cropId="cowpea" size={44} className="border-2 border-primary" />
        </span>
      </Link>

      <section aria-labelledby="fields-title" className="flex flex-col gap-3">
        <h2 id="fields-title" className="text-2xl font-bold">
          {H.fieldsTitle}
        </h2>
        {plots.length === 0 ? <p>{H.noFields}</p> : null}
        <ul className="flex flex-col gap-3">
          {plots.map((p) => (
            <li key={p.id}>
              <PlotCard plot={p} href={`/parcelles/${p.id}`} />
            </li>
          ))}
        </ul>
        <Button href="/parcelles/nouvelle" variant="outline" block icon={<Plus size={24} />}>
          {H.addField}
        </Button>
      </section>

      <Link href="/meteo" className="press flex items-center gap-4 rounded-box bg-base-200 p-5">
        <CloudSun aria-hidden="true" size={44} className="shrink-0 text-accent" />
        <span>
          <span className="block text-xl font-bold">{H.weatherTitle}</span>
          <span className="block">{weatherLine}</span>
        </span>
      </Link>
    </div>
  );
}
