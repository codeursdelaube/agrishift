import { CloudSun, Database, FlaskConical, TriangleAlert } from "lucide-react";
import { t } from "@/lib/i18n";
import type { SourceType } from "@/lib/types";

/** Bandeau bien visible pour les données synthétiques. */
export function DemoBanner() {
  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 rounded-box bg-warning px-4 py-2 text-center font-bold text-warning-content"
    >
      <TriangleAlert aria-hidden="true" size={20} strokeWidth={3} />
      {t.source.synthetic_demo}
    </div>
  );
}

function Chip({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-2xl bg-base-200 px-3 py-1 text-sm">
      <span className="shrink-0">{icon}</span>
      <span>{children}</span>
    </span>
  );
}

/** Provenance d'une donnée (API_FRONTEND §5.1). `computed` n'affiche rien. */
export function SourceBadge({
  sourceType,
  sourceName = "",
  period = "",
}: {
  sourceType: SourceType;
  sourceName?: string;
  period?: string;
}) {
  const S = t.source;
  switch (sourceType) {
    case "synthetic_demo":
      return <DemoBanner />;
    case "computed":
      return null;
    case "nasa_power":
      return <Chip icon={<Database aria-hidden="true" size={16} />}>{S.nasa_power(period)}</Chip>;
    case "public_historical_reanalysis":
      return (
        <Chip icon={<Database aria-hidden="true" size={16} />}>
          {S.public_historical_reanalysis(sourceName, period)}
        </Chip>
      );
    case "provisional_demo":
      return <Chip icon={<FlaskConical aria-hidden="true" size={16} />}>{S.provisional_demo}</Chip>;
    case "synthetic_scenario":
      return <Chip icon={<CloudSun aria-hidden="true" size={16} />}>{S.synthetic_scenario}</Chip>;
  }
}
