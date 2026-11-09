import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { cropIcons, FallowIcon, UnknownIcon, type CropIconId } from "@/components/icons";
import { CropPhoto } from "@/components/ui/Photo";
import type { PlotRow } from "@/lib/db";
import { cropLabel, sizeLabel, soilLabel } from "./labels";

function CropPicto({ cropId }: { cropId: string | null }) {
  if (cropId === null) return <UnknownIcon size={44} />;
  if (cropId === "fallow") return <FallowIcon size={44} />;
  const Icon = cropIcons[cropId as CropIconId] ?? UnknownIcon;
  return <Icon size={44} />;
}

/** Carte d'un champ : nom, taille, terre, dernière culture en pictogramme. */
export function PlotCard({ plot, href }: { plot: PlotRow; href: string }) {
  return (
    <Link
      href={href}
      className="press flex min-h-20 items-center gap-4 rounded-box border border-base-300 bg-base-100 p-4 shadow-sm hover:border-primary"
    >
      {plot.previous_crop_id && plot.previous_crop_id !== "fallow" ? (
        <CropPhoto cropId={plot.previous_crop_id} size={60} className="shrink-0" />
      ) : (
        <span className="shrink-0 rounded-full bg-primary/10 p-2 text-primary">
          <CropPicto cropId={plot.previous_crop_id} />
        </span>
      )}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-lg font-bold">{plot.name}</span>
        <span className="text-base opacity-80">
          {sizeLabel(plot.area_ha)} · {soilLabel(plot.soil_id)}
        </span>
        <span className="text-sm opacity-80">{cropLabel(plot.previous_crop_id)}</span>
      </span>
      <ChevronRight aria-hidden="true" size={28} className="shrink-0" />
    </Link>
  );
}
