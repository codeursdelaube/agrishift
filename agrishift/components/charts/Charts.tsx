"use client";

import { useState } from "react";
import type { DekadStep } from "@/engine/types";
import { friendlyDekad, MONTH_SHORT, n0 } from "@/lib/format";
import { t } from "@/lib/i18n";

const A = t.advice;
const W = 340;
const H = 190;
const PAD = { left: 30, right: 4, top: 10, bottom: 24 };
const INNER_W = W - PAD.left - PAD.right;
const INNER_H = H - PAD.top - PAD.bottom;

function niceMax(value: number): number {
  const steps = [20, 40, 60, 80, 100, 150, 200, 250, 300, 400, 500];
  return steps.find((s) => s >= value) ?? Math.ceil(value / 100) * 100;
}

/** Barre à sommet arrondi, posée sur la ligne de base. */
function barPath(x: number, y: number, w: number, base: number): string {
  const r = Math.min(4, w / 2, Math.max(0, base - y));
  return `M${x} ${base}V${y + r}Q${x} ${y} ${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${base}Z`;
}

function Grid({ max }: { max: number }) {
  const y = (v: number) => PAD.top + INNER_H * (1 - v / max);
  return (
    <g>
      {[0, max / 2, max].map((v) => (
        <g key={v}>
          <line x1={PAD.left} x2={W - PAD.right} y1={y(v)} y2={y(v)} stroke="currentColor" strokeOpacity={v === 0 ? 0.35 : 0.12} />
          <text x={PAD.left - 5} y={y(v) + 4} textAnchor="end" fontSize="11" fill="currentColor" fillOpacity="0.75">
            {v}
          </text>
        </g>
      ))}
    </g>
  );
}

function Hit({ count, onSelect }: { count: number; onSelect: (i: number) => void }) {
  const band = INNER_W / count;
  return (
    <g>
      {Array.from({ length: count }, (_, i) => (
        <rect
          key={i}
          x={PAD.left + i * band}
          y={PAD.top}
          width={band}
          height={INNER_H + PAD.bottom}
          fill="transparent"
          onPointerEnter={() => onSelect(i)}
          onClick={() => onSelect(i)}
        />
      ))}
    </g>
  );
}

function Numbers({ head, rows }: { head: string[]; rows: (string | number)[][] }) {
  return (
    <details className="text-sm">
      <summary className="flex min-h-12 cursor-pointer items-center font-bold">{A.seeNumbers}</summary>
      <table className="table table-sm">
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={String(r[0])}>
              {r.map((c, i) => (
                <td key={i}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}

/** Pluie (barres) et besoin de la plante (ligne), même échelle en mm. */
export function SeasonWaterChart({ steps, title }: { steps: DekadStep[]; title: string }) {
  const [active, setActive] = useState<number | null>(null);
  const max = niceMax(Math.max(...steps.map((s) => Math.max(s.p_mm, s.etc_mm)), 10));
  const band = INNER_W / steps.length;
  const barW = Math.max(6, band - 10);
  const y = (v: number) => PAD.top + INNER_H * (1 - v / max);
  const cx = (i: number) => PAD.left + band * (i + 0.5);
  const base = y(0);
  const line = steps.map((s, i) => `${i === 0 ? "M" : "L"}${cx(i).toFixed(1)} ${y(s.etc_mm).toFixed(1)}`).join("");
  const current = active === null ? null : steps[active];

  return (
    <figure className="flex flex-col gap-2">
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
        <li className="flex items-center gap-1.5">
          <span aria-hidden="true" className="h-3 w-3 rounded-sm" style={{ background: "var(--chart-rain)" }} />
          {A.chartRain}
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden="true" className="h-0.5 w-4 rounded" style={{ background: "var(--chart-need)" }} />
          {A.chartNeed}
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden="true" className="h-3 w-3 rounded-sm bg-error/20" />
          {A.chartLack}
        </li>
      </ul>
      <p className="min-h-6 text-sm font-bold" aria-live="polite">
        {current ? A.chartValue(friendlyDekad(current.label_fr), n0(current.p_mm), n0(current.etc_mm)) : A.chartHint}
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full touch-pan-y" role="img" aria-label={title} onPointerLeave={() => setActive(null)}>
        {steps.map((s, i) =>
          s.stress > 0.2 ? <rect key={s.dekad} x={PAD.left + i * band} y={PAD.top} width={band} height={INNER_H} className="fill-error/20" /> : null,
        )}
        <Grid max={max} />
        {active !== null ? <rect x={PAD.left + active * band} y={PAD.top} width={band} height={INNER_H} fill="currentColor" fillOpacity="0.07" /> : null}
        {steps.map((s, i) => (
          <path key={s.dekad} d={barPath(cx(i) - barW / 2, y(s.p_mm), barW, base)} style={{ fill: "var(--chart-rain)" }} />
        ))}
        <path d={line} fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: "var(--chart-need)" }} />
        {active !== null && current ? (
          <circle cx={cx(active)} cy={y(current.etc_mm)} r="4" strokeWidth="2" className="stroke-base-100" style={{ fill: "var(--chart-need)" }} />
        ) : null}
        {steps.map((s, i) =>
          i === 0 || i === steps.length - 1 || i === Math.floor(steps.length / 2) ? (
            <text key={s.dekad} x={cx(i)} y={H - 7} textAnchor={i === 0 ? "start" : i === steps.length - 1 ? "end" : "middle"} fontSize="11" fill="currentColor" fillOpacity="0.8">
              {friendlyDekad(s.label_fr)}
            </text>
          ) : null,
        )}
        <Hit count={steps.length} onSelect={setActive} />
      </svg>
      <Numbers
        head={[A.period, `${A.chartRain} (mm)`, `${A.chartNeed} (mm)`]}
        rows={steps.map((s) => [friendlyDekad(s.label_fr), n0(s.p_mm), n0(s.etc_mm)])}
      />
    </figure>
  );
}

const MONTHS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

/** Pluie normale par mois ; les mois de semis ressortent. */
export function MonthlyRainChart({
  values,
  highlighted,
  title,
  readout,
  hint,
}: {
  values: number[];
  highlighted: Set<number>;
  title: string;
  readout: (month: string, mm: string) => string;
  hint: string;
}) {
  const [active, setActive] = useState<number | null>(null);
  const max = niceMax(Math.max(...values, 10));
  const band = INNER_W / 12;
  const barW = band - 6;
  const y = (v: number) => PAD.top + INNER_H * (1 - v / max);
  const base = y(0);

  return (
    <figure className="flex flex-col gap-2">
      <p className="min-h-6 text-sm font-bold" aria-live="polite">
        {active === null ? hint : readout(MONTHS[active], n0(values[active]))}
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full touch-pan-y" role="img" aria-label={title} onPointerLeave={() => setActive(null)}>
        <Grid max={max} />
        {active !== null ? <rect x={PAD.left + active * band} y={PAD.top} width={band} height={INNER_H} fill="currentColor" fillOpacity="0.07" /> : null}
        {values.map((v, i) => (
          <path
            key={i}
            d={barPath(PAD.left + i * band + 3, y(v), barW, base)}
            fillOpacity={highlighted.has(i) ? 1 : 0.5}
            style={{ fill: "var(--chart-rain)" }}
          />
        ))}
        {MONTH_SHORT.map((m, i) => (
          <text key={i} x={PAD.left + band * (i + 0.5)} y={H - 7} textAnchor="middle" fontSize="11" fill="currentColor" fillOpacity="0.8">
            {m}
          </text>
        ))}
        <Hit count={12} onSelect={setActive} />
      </svg>
      <Numbers head={[A.period, `${A.chartRain} (mm)`]} rows={values.map((v, i) => [MONTHS[i], n0(v)])} />
    </figure>
  );
}
