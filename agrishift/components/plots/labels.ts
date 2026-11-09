import { t } from "@/lib/i18n";
import { getZone } from "@/lib/zones";

export type SizeCategory = "small" | "medium" | "large";

/** Surface représentative de chaque catégorie de taille (ha). */
export const SIZE_AREA: Record<SizeCategory, number> = { small: 0.25, medium: 1, large: 3 };

export function sizeCategory(areaHa: number): SizeCategory {
  if (areaHa < 0.5) return "small";
  if (areaHa <= 2) return "medium";
  return "large";
}

/** « Moyen (1 ha) » : catégorie en mots + surface. */
export function sizeLabel(areaHa: number): string {
  return `${t.plot.sizes[sizeCategory(areaHa)].label} (${t.plot.hectares(areaHa)})`;
}

export function soilLabel(soilId: string): string {
  return (t.soils as Record<string, string>)[soilId] ?? soilId;
}

export function zoneLabel(zoneId: string): string {
  return getZone(zoneId)?.name_fr ?? zoneId;
}

export function cropLabel(cropId: string | null): string {
  if (cropId === null) return t.plot.dontKnow;
  if (cropId === "fallow") return t.plot.fallow;
  return (t.crops as Record<string, string>)[cropId] ?? cropId;
}
