"use client";

import { CloudDrizzle, CloudRain, Sun, WifiOff } from "lucide-react";
import { useEffect } from "react";
import { DemoBanner, SourceBadge } from "@/components/badges/SourceBadge";
import { TrendCard } from "@/components/climate/TrendCard";
import { Skeleton } from "@/components/ui/ComingSoon";
import { PhotoHeader } from "@/components/ui/Photo";
import { addDekads, dayNameFr, dekadOf, friendlyDekad, n0, olderThan, relativeFr } from "@/lib/format";
import { useForecast, useOnline, usePack, useProfile } from "@/lib/hooks";
import { t } from "@/lib/i18n";
import { refreshForecast, type Forecast } from "@/lib/remote";
import { getZone } from "@/lib/zones";

const W = t.weather;
const THREE_DAYS = 3 * 86_400_000;

function DayIcon({ mm }: { mm: number }) {
  if (mm >= 5) return <CloudRain aria-hidden="true" size={36} className="text-accent" />;
  if (mm >= 1) return <CloudDrizzle aria-hidden="true" size={36} className="text-accent" />;
  return <Sun aria-hidden="true" size={36} className="text-secondary" />;
}

/** Météo : prévision Open-Meteo en ligne, normales NASA toujours disponibles. */
export default function WeatherPage() {
  const profile = useProfile();
  const pack = usePack(profile?.zone_id);
  const forecast = useForecast(profile?.zone_id);
  const online = useOnline();
  const zone = getZone(profile?.zone_id);

  useEffect(() => {
    if (zone && online) void refreshForecast(zone.zone_id, zone.latitude, zone.longitude).catch(() => {});
  }, [zone, online]);

  if (profile === undefined || pack === undefined || forecast === undefined) return <Skeleton lines={5} />;

  const usable = forecast && !olderThan(forecast.fetched_at, THREE_DAYS);
  const daily = usable ? (forecast.data as Forecast).daily : null;
  const current = dekadOf(new Date());
  const normals = pack
    ? [0, 1, 2].flatMap((i) => pack.climate.dekads.filter((d) => d.dekad === addDekads(current, i)))
    : [];

  return (
    <div className="flex flex-col gap-6">
      <PhotoHeader image="weather" title={W.title} subtitle={zone?.name_fr} />

      <section aria-labelledby="forecast" className="flex flex-col gap-3">
        <h2 id="forecast" className="text-2xl font-bold">{W.forecastTitle}</h2>
        {daily ? (
          <>
            <ul className="flex flex-col gap-2">
              {daily.time.map((day, i) => {
                const mm = daily.precipitation_sum[i] ?? 0;
                const chance = daily.precipitation_probability_max[i];
                return (
                  <li key={day} className="flex items-center gap-3 rounded-box bg-base-200 p-3">
                    <DayIcon mm={mm} />
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold">{i === 0 ? W.today : dayNameFr(day)}</span>
                      <span className="block text-sm">
                        {W.rainMm(n0(mm))}
                        {chance !== null ? ` · ${W.rainChance(chance)}` : ""}
                      </span>
                    </span>
                    <span className="shrink-0 font-bold">
                      {W.minMax(n0(daily.temperature_2m_min[i] ?? 0), n0(daily.temperature_2m_max[i] ?? 0))}
                    </span>
                  </li>
                );
              })}
            </ul>
            <p className="text-sm opacity-80">
              {online
                ? W.forecastSource(relativeFr(forecast!.fetched_at))
                : W.forecastOld(relativeFr(forecast!.fetched_at))}
            </p>
          </>
        ) : (
          <p className="flex items-center gap-2 rounded-box bg-base-200 p-4">
            <WifiOff aria-hidden="true" size={22} className="shrink-0" />
            {W.forecastNone}
          </p>
        )}
      </section>

      {pack ? (
        <>
          {pack.climate.source_type === "synthetic_demo" ? <DemoBanner /> : null}
          <section aria-labelledby="normal" className="flex flex-col gap-3">
            <h2 id="normal" className="text-2xl font-bold">{W.normalTitle}</h2>
            <ul className="flex flex-col gap-2">
              {normals.map((d) => (
                <li key={d.dekad} className="rounded-box border border-base-300 p-3">
                  {W.normalLine(friendlyDekad(d.label_fr), n0(d.p_mm), n0(d.tmean_c))}
                </li>
              ))}
            </ul>
            <SourceBadge sourceType={pack.climate.source_type} sourceName={pack.climate.source_name} period={pack.climate.baseline_period} />
          </section>
          <TrendCard pack={pack} />
        </>
      ) : null}
    </div>
  );
}
