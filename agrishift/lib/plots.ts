import type { PlotRow, PlotSeasonRow } from "./db";

/**
 * Culture à donner au moteur : la dernière saison déclarée, sinon la réponse
 * de l'assistant. « Jachère » n'est pas une culture pour le moteur.
 */
export function previousCropFor(plot: PlotRow, seasons: PlotSeasonRow[]): string | null {
  const declared = seasons.find((s) => s.crop_id)?.crop_id;
  if (declared) return declared;
  return plot.previous_crop_id === "fallow" ? null : plot.previous_crop_id;
}
