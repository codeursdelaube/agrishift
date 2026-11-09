import { Check, TriangleAlert, X } from "lucide-react";
import { t } from "@/lib/i18n";
import type { RiskLevel } from "@/lib/risk";

const config = {
  good: { Icon: Check, cls: "badge-success", label: t.risk.good },
  warning: { Icon: TriangleAlert, cls: "badge-warning", label: t.risk.warning },
  risky: { Icon: X, cls: "badge-error", label: t.risk.risky },
} as const;

/** Risque = couleur + icône + mot (jamais la couleur seule). */
export function RiskBadge({ level, className = "" }: { level: RiskLevel; className?: string }) {
  const { Icon, cls, label } = config[level];
  return (
    <span className={`badge ${cls} h-auto min-h-8 gap-1.5 px-3 py-1 font-bold text-base ${className}`}>
      <Icon aria-hidden="true" size={18} strokeWidth={3} />
      {label}
    </span>
  );
}
