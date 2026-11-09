import type { ZoneHighlight } from "@/components/illustrations/TogoMap";

export interface ZoneInfo {
  zone_id: string;
  name_fr: string;
  town_fr: string;
  map: Exclude<ZoneHighlight, null>;
  latitude: number;
  longitude: number;
}

/**
 * Zones pilotes. Les identifiants suivent les noms des paquets (§6.3).
 * Les coordonnées servent seulement à « Me localiser » (zone la plus proche).
 */
export const ZONES: readonly ZoneInfo[] = [
  { zone_id: "maritime_lome", name_fr: "Maritime", town_fr: "Lomé", map: "maritime", latitude: 6.13, longitude: 1.22 },
  { zone_id: "plateaux_kpalime", name_fr: "Plateaux", town_fr: "Kpalimé", map: "plateaux", latitude: 6.9, longitude: 0.63 },
  { zone_id: "kara_kara", name_fr: "Kara", town_fr: "Kara", map: "kara", latitude: 9.55, longitude: 1.19 },
];

export function getZone(zoneId: string | undefined): ZoneInfo | undefined {
  return ZONES.find((z) => z.zone_id === zoneId);
}

/** « Maritime (Lomé) », ou « Kara » quand la ville porte le nom de la région. */
export function zoneFullName(zone: ZoneInfo): string {
  return zone.name_fr === zone.town_fr ? zone.name_fr : `${zone.name_fr} (${zone.town_fr})`;
}

/** Zone la plus proche (distance approximative, suffisante à cette échelle). */
export function nearestZone(lat: number, lon: number): ZoneInfo {
  let best = ZONES[0];
  let bestD = Infinity;
  for (const z of ZONES) {
    const d = (z.latitude - lat) ** 2 + ((z.longitude - lon) * Math.cos((lat * Math.PI) / 180)) ** 2;
    if (d < bestD) {
      bestD = d;
      best = z;
    }
  }
  return best;
}
