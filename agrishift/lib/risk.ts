export type RiskLevel = "good" | "warning" | "risky";

/**
 * Traduit un indice de stress (0 = aucun manque d'eau, 1 = manque total)
 * en niveau de risque affiché (§8.7).
 */
export function riskFromStress(stressIndex: number): RiskLevel {
  if (stressIndex < 0.15) return "good";
  if (stressIndex < 0.35) return "warning";
  return "risky";
}
