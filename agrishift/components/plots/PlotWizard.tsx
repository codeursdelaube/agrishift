"use client";

import { ArrowRight, Check, Ruler } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  cropIcons,
  FallowIcon,
  soilIcons,
  UnknownIcon,
  type CropIconId,
  type SoilIconId,
} from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { ChoiceCard, Wizard } from "@/components/wizard/Wizard";
import { db, nowIso, saveWithOutbox, type PlotRow } from "@/lib/db";
import { t } from "@/lib/i18n";
import { cropLabel, SIZE_AREA, sizeCategory, sizeLabel, soilLabel, type SizeCategory } from "./labels";

const P = t.plot;
const TOTAL = 5;
const SIZES: SizeCategory[] = ["small", "medium", "large"];
const SOILS = Object.keys(soilIcons) as SoilIconId[];
const CROPS = Object.keys(cropIcons) as CropIconId[];
const DEFAULT_SOIL: SoilIconId = "sandy_loam";

type Props = {
  zoneId: string;
  /** Champ existant (modification) ; absent pour un nouveau champ. */
  initial?: PlotRow;
  /** Nombre de champs existants, pour le nom par défaut « Champ N ». */
  existingCount: number;
};

/** Assistant d'ajout / modification d'un champ (§9.5). */
export function PlotWizard({ zoneId, initial, existingCount }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [name, setName] = useState(initial?.name ?? P.defaultName(existingCount + 1));
  const [area, setArea] = useState<number | null>(initial?.area_ha ?? null);
  const [exact, setExact] = useState(false);
  const [exactText, setExactText] = useState(initial ? String(initial.area_ha) : "");
  const [soil, setSoil] = useState<string | null>(initial?.soil_id ?? null);
  const [soilAssumed, setSoilAssumed] = useState(initial?.soil_assumed ?? false);
  // undefined = pas encore répondu ; null = « Je ne sais pas ».
  const [lastCrop, setLastCrop] = useState<string | null | undefined>(
    initial ? initial.previous_crop_id : undefined,
  );
  const [saving, setSaving] = useState(false);

  const back = step > 1 ? () => setStep(step - 1) : () => router.back();
  const next = () => setStep(step + 1);

  async function save() {
    if (area === null || soil === null || lastCrop === undefined) return;
    setSaving(true);
    const row: PlotRow = {
      id: initial?.id ?? crypto.randomUUID(),
      zone_id: initial?.zone_id ?? zoneId,
      name: name.trim() || P.defaultName(existingCount + 1),
      area_ha: area,
      soil_id: soil,
      soil_assumed: soilAssumed,
      previous_crop_id: lastCrop,
      updated_at: nowIso(),
      deleted: false,
      sync_state: "pending",
    };
    await saveWithOutbox("plots", row);
    router.push(initial ? `/parcelles/${row.id}` : "/accueil");
  }

  if (step === 1) {
    return (
      <Wizard
        step={1}
        total={TOTAL}
        question={P.nameQ}
        onBack={back}
        footer={
          <Button block size="lg" onClick={next} icon={<ArrowRight size={24} />}>
            {t.common.next}
          </Button>
        }
      >
        <label className="flex flex-col gap-2">
          <span className="text-lg font-bold">{P.nameLabel}</span>
          <input
            type="text"
            maxLength={40}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input input-lg w-full text-lg"
          />
        </label>
      </Wizard>
    );
  }

  if (step === 2) {
    const exactValue = Number(exactText.replace(",", "."));
    const exactValid = exactText.trim() !== "" && Number.isFinite(exactValue) && exactValue > 0 && exactValue <= 100;
    return (
      <Wizard
        step={2}
        total={TOTAL}
        question={P.sizeQ}
        onBack={back}
        footer={
          <Button
            block
            size="lg"
            disabled={exact ? !exactValid : area === null}
            onClick={() => {
              if (exact) setArea(Math.round(exactValue * 100) / 100);
              next();
            }}
            icon={<ArrowRight size={24} />}
          >
            {t.common.next}
          </Button>
        }
      >
        <div role="radiogroup" aria-label={P.sizeQ} className="flex flex-col gap-3">
          {SIZES.map((s, i) => (
            <ChoiceCard
              key={s}
              selected={!exact && area !== null && sizeCategory(area) === s}
              onSelect={() => {
                setExact(false);
                setArea(SIZE_AREA[s]);
              }}
              icon={
                <span
                  aria-hidden="true"
                  className="block rounded-md border-4 border-current"
                  style={{ width: 20 + i * 14, height: 20 + i * 14 }}
                />
              }
              label={P.sizes[s].label}
              description={P.sizes[s].desc}
            />
          ))}
        </div>
        <div className="mt-4">
          {exact ? (
            <label className="flex flex-col gap-2">
              <span className="text-lg font-bold">{P.exactSizeLabel}</span>
              <input
                type="text"
                inputMode="decimal"
                value={exactText}
                onChange={(e) => setExactText(e.target.value)}
                className="input input-lg w-full text-lg"
              />
            </label>
          ) : (
            <Button variant="ghost" block onClick={() => setExact(true)} icon={<Ruler size={22} />}>
              {P.exactSize}
            </Button>
          )}
        </div>
      </Wizard>
    );
  }

  if (step === 3) {
    return (
      <Wizard
        step={3}
        total={TOTAL}
        question={P.soilQ}
        hint={P.soilHint}
        onBack={back}
        footer={
          <Button block size="lg" disabled={soil === null} onClick={next} icon={<ArrowRight size={24} />}>
            {t.common.next}
          </Button>
        }
      >
        <div role="radiogroup" aria-label={P.soilQ} className="flex flex-col gap-3">
          {SOILS.map((s) => {
            const Icon = soilIcons[s];
            return (
              <ChoiceCard
                key={s}
                selected={soil === s && !soilAssumed}
                onSelect={() => {
                  setSoil(s);
                  setSoilAssumed(false);
                }}
                icon={<Icon size={48} />}
                label={t.soils[s]}
                description={P.soilTouch[s]}
              />
            );
          })}
          <ChoiceCard
            selected={soilAssumed}
            onSelect={() => {
              setSoil(DEFAULT_SOIL);
              setSoilAssumed(true);
            }}
            icon={<UnknownIcon size={48} />}
            label={P.dontKnow}
            description={P.soilAssumed}
          />
        </div>
      </Wizard>
    );
  }

  if (step === 4) {
    const options: { id: string | null; label: string; icon: ReactNode }[] = [
      ...CROPS.map((c) => {
        const Icon = cropIcons[c];
        return { id: c as string | null, label: t.crops[c], icon: <Icon size={44} /> };
      }),
      { id: "fallow", label: P.fallow, icon: <FallowIcon size={44} /> },
      { id: null, label: P.dontKnow, icon: <UnknownIcon size={44} /> },
    ];
    return (
      <Wizard
        step={4}
        total={TOTAL}
        question={P.lastCropQ}
        onBack={back}
        footer={
          <Button
            block
            size="lg"
            disabled={lastCrop === undefined}
            onClick={next}
            icon={<ArrowRight size={24} />}
          >
            {t.common.next}
          </Button>
        }
      >
        <div role="radiogroup" aria-label={P.lastCropQ} className="grid grid-cols-2 gap-3">
          {options.map((o) => {
            const selected = lastCrop === o.id;
            return (
              <button
                key={o.id ?? "unknown"}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setLastCrop(o.id)}
                className={`press flex min-h-28 flex-col items-center justify-center gap-2 rounded-box border-2 p-3 text-center font-bold ${
                  selected ? "border-primary bg-primary/10" : "border-base-300 bg-base-100"
                }`}
              >
                <span className="text-primary">{o.icon}</span>
                {o.label}
              </button>
            );
          })}
        </div>
      </Wizard>
    );
  }

  const rows: [string, string][] = [
    [P.summary.name, name.trim() || P.defaultName(existingCount + 1)],
    [P.summary.size, area !== null ? sizeLabel(area) : "—"],
    [P.summary.soil, soil ? (soilAssumed ? P.soilAssumed : soilLabel(soil)) : "—"],
    [P.summary.lastCrop, lastCrop !== undefined ? cropLabel(lastCrop) : "—"],
  ];

  return (
    <Wizard
      step={5}
      total={TOTAL}
      question={P.summaryQ}
      onBack={back}
      footer={
        <Button block size="lg" disabled={saving} onClick={() => void save()} icon={<Check size={24} />}>
          {t.common.save}
        </Button>
      }
    >
      <dl className="divide-y divide-base-300 rounded-box border border-base-300">
        {rows.map(([label, value], i) => (
          <div key={label} className="flex items-center justify-between gap-3 p-4">
            <div>
              <dt className="text-sm opacity-80">{label}</dt>
              <dd className="text-lg font-bold">{value}</dd>
            </div>
            <button
              type="button"
              className="btn btn-ghost min-h-12 h-auto rounded-full"
              onClick={() => setStep(i + 1)}
            >
              {P.edit}
            </button>
          </div>
        ))}
      </dl>
    </Wizard>
  );
}

/** Supprime (logiquement) un champ ; renvoie une fonction pour annuler. */
export async function softDeletePlot(plot: PlotRow): Promise<() => Promise<void>> {
  await saveWithOutbox("plots", { ...plot, deleted: true, updated_at: nowIso(), sync_state: "pending" });
  return async () => {
    const current = await db.plots.get(plot.id);
    if (current) {
      await saveWithOutbox("plots", { ...current, deleted: false, updated_at: nowIso(), sync_state: "pending" });
    }
  };
}
