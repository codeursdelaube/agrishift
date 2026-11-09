import { useId } from "react";

export type ZoneHighlight = "maritime" | "plateaux" | "kara" | null;

/*
 * Carte du Togo construite à partir des coordonnées géographiques de la frontière
 * (contour simplifié, type Natural Earth, avec la côte corrigée).
 * Projection simple : x = (lon + 0.05) × 60 + 6 ; y = (11.02 − lat) × 60 + 6.
 * Les limites entre régions sont approximatives (bandes simplifiées) :
 * suffisant pour se repérer, pas pour mesurer.
 */

/** Frontière : nord (Burkina Faso) → est (Bénin) → côte → ouest (Ghana). */
const COUNTRY =
  // Nord : frontière avec le Burkina Faso, puis le Bénin (avec le décrochement nord-est).
  "M9 7.2 L64.2 7.8 L55.8 37.2 L73.8 56.4 L93 76.2 L94.2 103.2 L106.2 121.2 " +
  // Est : frontière avec le Bénin, puis le fleuve Mono jusqu'à la mer.
  "L103.8 151.2 L106.8 193.2 L102 223.2 L106.1 257.3 L111 274.8 L111 294 " +
  // Côte : d'Aného à Lomé.
  "L96 297 L81 301.2 " +
  // Ouest : frontière avec le Ghana, de Lomé à Dapaong.
  "L72 292.2 L63 280.2 L54 270 L42 253.2 L40.8 223.2 L46.2 196.2 L51 169.2 " +
  "L37.2 148.2 L31.8 115.2 L28.8 85.2 L31.2 55.2 L18 40.2 L6 24 Z";

type RegionId = "savanes" | "kara" | "centrale" | "plateaux" | "maritime";

/** Bandes des 5 régions (découpées ensuite par la frontière). */
const REGIONS: { id: RegionId; name: string; points: string; labelX: number; labelY: number }[] = [
  { id: "savanes", name: "Savanes", points: "0,0 130,0 130,54 0,60", labelX: 34, labelY: 30 },
  { id: "kara", name: "Kara", points: "0,60 130,54 130,118 0,118", labelX: 60, labelY: 86 },
  { id: "centrale", name: "Centrale", points: "0,118 130,118 130,172 0,172", labelX: 72, labelY: 148 },
  { id: "plateaux", name: "Plateaux", points: "0,172 130,172 130,262 0,270", labelX: 74, labelY: 214 },
  { id: "maritime", name: "Maritime", points: "0,270 130,262 130,320 0,320", labelX: 84, labelY: 284 },
];

/** Villes de référence des zones pilotes (positions projetées). */
const TOWNS: {
  zone: Exclude<ZoneHighlight, null>;
  name: string;
  x: number;
  y: number;
  /** Côté du libellé : à droite du point, ou à gauche près du bord. */
  side: "right" | "left";
}[] = [
  { zone: "kara", name: "Kara", x: 80.4, y: 94.2, side: "left" },
  { zone: "plateaux", name: "Kpalimé", x: 49, y: 252, side: "right" },
  { zone: "maritime", name: "Lomé", x: 83, y: 294, side: "left" },
];

const PILOTS = new Set<RegionId>(["kara", "plateaux", "maritime"]);

/**
 * Carte du Togo avec les 5 régions. Les 3 zones pilotes sont en vert ;
 * la zone choisie (`highlight`) est mise en évidence.
 */
export function TogoMap({
  highlight = null,
  title,
  className = "",
  showLabels = false,
}: {
  highlight?: ZoneHighlight;
  title: string;
  className?: string;
  /** Noms des régions et des villes (pour les grandes tailles uniquement). */
  showLabels?: boolean;
}) {
  const clipId = `togo-clip-${useId().replace(/:/g, "")}`;

  function regionFill(id: RegionId) {
    if (!PILOTS.has(id)) return "var(--color-base-300)";
    if (highlight === null || highlight === id) return "var(--color-primary)";
    return "color-mix(in oklab, var(--color-primary) 30%, var(--color-base-200))";
  }

  return (
    <svg
      viewBox="0 0 128 318"
      role="img"
      aria-label={title}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <clipPath id={clipId}>
          <path d={COUNTRY} />
        </clipPath>
      </defs>

      {/* Golfe de Guinée */}
      <path
        d="M40 314 C70 306 100 312 126 304"
        stroke="var(--color-accent)"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        opacity="0.7"
      />

      <g clipPath={`url(#${clipId})`}>
        {REGIONS.map((r) => (
          <polygon
            key={r.id}
            points={r.points}
            fill={regionFill(r.id)}
            stroke="var(--color-base-100)"
            strokeWidth="2"
          />
        ))}
      </g>

      <path d={COUNTRY} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />

      {TOWNS.map((town) => {
        const active = highlight === null || highlight === town.zone;
        return (
          <g key={town.name}>
            <circle
              cx={town.x}
              cy={town.y}
              r={active ? 4.5 : 3}
              fill="var(--color-base-100)"
              stroke="currentColor"
              strokeWidth="2"
            />
            {showLabels ? (
              <text
                x={town.side === "right" ? town.x + 7 : town.x - 7}
                y={town.y + 4}
                textAnchor={town.side === "right" ? "start" : "end"}
                fontSize="11"
                fontWeight="700"
                fill="currentColor"
              >
                {town.name}
              </text>
            ) : null}
          </g>
        );
      })}

      {showLabels
        ? REGIONS.filter((r) => !PILOTS.has(r.id)).map((r) => (
            <text
              key={r.id}
              x={r.labelX}
              y={r.labelY}
              fontSize="10"
              textAnchor="middle"
              fill="currentColor"
              opacity="0.75"
            >
              {r.name}
            </text>
          ))
        : null}
    </svg>
  );
}
