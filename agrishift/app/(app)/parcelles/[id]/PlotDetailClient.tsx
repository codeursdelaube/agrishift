"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { Pencil, Plus, Sprout, Trash2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { cropIcons, FallowIcon, type CropIconId } from "@/components/icons";
import { cropLabel, sizeLabel, soilLabel } from "@/components/plots/labels";
import { softDeletePlot } from "@/components/plots/PlotWizard";
import { Button } from "@/components/ui/Button";
import { ComingSoon, Skeleton } from "@/components/ui/ComingSoon";
import { CropPhoto } from "@/components/ui/Photo";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useUndoToast } from "@/components/ui/UndoToast";
import { db, nowIso, saveWithOutbox } from "@/lib/db";
import { t } from "@/lib/i18n";

const P = t.plot;
const CROPS = Object.keys(cropIcons) as CropIconId[];

function AddSeasonForm({ plotId, onDone }: { plotId: string; onDone: () => void }) {
  const [label, setLabel] = useState("");
  const [crop, setCrop] = useState<CropIconId | null>(null);
  const [note, setNote] = useState("");

  async function submit() {
    if (!label.trim() || !crop) return;
    await saveWithOutbox("plot_seasons", {
      id: crypto.randomUUID(),
      plot_id: plotId,
      season_label: label.trim(),
      crop_id: crop,
      ...(note.trim() ? { yield_note: note.trim() } : {}),
      updated_at: nowIso(),
      deleted: false,
      sync_state: "pending",
    });
    onDone();
  }

  return (
    <div className="flex flex-col gap-4 rounded-box border-2 border-primary p-4">
      <label className="flex flex-col gap-2">
        <span className="font-bold">{P.seasonLabel}</span>
        <input
          type="text"
          maxLength={32}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="input input-lg w-full"
        />
      </label>
      <fieldset>
        <legend className="mb-2 font-bold">{P.seasonCrop}</legend>
        <div role="radiogroup" aria-label={P.seasonCrop} className="grid grid-cols-3 gap-2">
          {CROPS.map((c) => {
            const Icon = cropIcons[c];
            const selected = crop === c;
            return (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setCrop(c)}
                className={`flex min-h-20 flex-col items-center justify-center gap-1 rounded-box border-2 p-2 text-sm font-bold ${
                  selected ? "border-primary bg-primary/10" : "border-base-300"
                }`}
              >
                <span className="text-primary">
                  <Icon size={36} />
                </span>
                {t.crops[c]}
              </button>
            );
          })}
        </div>
      </fieldset>
      <label className="flex flex-col gap-2">
        <span className="font-bold">{P.seasonNote}</span>
        <textarea
          maxLength={1000}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="textarea w-full text-base"
          rows={2}
        />
      </label>
      <div className="flex flex-col gap-2">
        <Button block disabled={!label.trim() || !crop} onClick={() => void submit()}>
          {t.common.save}
        </Button>
        <Button block variant="ghost" onClick={onDone}>
          {t.common.cancel}
        </Button>
      </div>
    </div>
  );
}

/** Détail d'un champ : infos, historique des saisons, modifier, supprimer (§9.5). */
export default function PlotDetailPage() {
  const { id } = useParams<{ id: string }>();
  const plot = useLiveQuery(async () => (await db.plots.get(id)) ?? null, [id]);
  const seasons = useLiveQuery(
    async () =>
      (await db.plotSeasons.where("plot_id").equals(id).toArray())
        .filter((s) => !s.deleted)
        .sort((a, b) => b.updated_at.localeCompare(a.updated_at)),
    [id],
  );
  const [confirming, setConfirming] = useState(false);
  const [adding, setAdding] = useState(false);
  const toast = useUndoToast();

  if (plot === undefined || seasons === undefined) return <Skeleton lines={4} />;

  if (plot === null || plot.deleted) {
    return (
      <>
        <ComingSoon icon={<FallowIcon size={72} />} title={plot?.deleted ? P.deleted : P.notFound}>
          <Button href="/accueil">{t.common.backHome}</Button>
        </ComingSoon>
        {toast.element}
      </>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold">{plot.name}</h1>
        {plot.sync_state === "rejected" ? (
          <p role="alert" className="mt-2 rounded-box bg-warning/15 p-3 font-bold">
            {P.lastSync}{" "}
            {(t.sync.rejected as Record<string, string>)[plot.sync_error ?? ""] ?? ""}
          </p>
        ) : null}
        <dl className="mt-3 grid gap-2 text-lg">
          <div>
            <dt className="inline opacity-80">{P.summary.size} : </dt>
            <dd className="inline font-bold">{sizeLabel(plot.area_ha)}</dd>
          </div>
          <div>
            <dt className="inline opacity-80">{P.summary.soil} : </dt>
            <dd className="inline font-bold">
              {plot.soil_assumed ? P.soilAssumed : soilLabel(plot.soil_id)}
            </dd>
          </div>
          <div>
            <dt className="inline opacity-80">{P.summary.lastCrop} : </dt>
            <dd className="inline font-bold">{cropLabel(plot.previous_crop_id)}</dd>
          </div>
        </dl>
      </div>

      <Button href={`/conseil/${plot.id}`} size="lg" block icon={<Sprout size={26} />}>
        {P.adviceForField}
      </Button>

      <section aria-labelledby="history-title" className="flex flex-col gap-3">
        <h2 id="history-title" className="text-2xl font-bold">
          {P.historyTitle}
        </h2>
        {seasons.length === 0 ? <p>{P.historyEmpty}</p> : null}
        <ul className="flex flex-col gap-2">
          {seasons.map((s) => {
            return (
              <li key={s.id} className="flex items-center gap-3 rounded-box bg-base-200 p-3">
                {s.crop_id ? (
                  <CropPhoto cropId={s.crop_id} size={48} className="shrink-0" />
                ) : (
                  <span className="text-primary">
                    <FallowIcon size={40} />
                  </span>
                )}
                <span>
                  <span className="block font-bold">
                    {s.season_label} — {cropLabel(s.crop_id)}
                  </span>
                  {s.yield_note ? <span className="block text-base">{s.yield_note}</span> : null}
                </span>
              </li>
            );
          })}
        </ul>
        {adding ? (
          <AddSeasonForm plotId={plot.id} onDone={() => setAdding(false)} />
        ) : (
          <Button variant="outline" block onClick={() => setAdding(true)} icon={<Plus size={22} />}>
            {P.addSeason}
          </Button>
        )}
      </section>

      <div className="flex flex-col gap-3">
        <Button href={`/parcelles/${plot.id}/modifier`} variant="outline" block icon={<Pencil size={22} />}>
          {P.editTitle}
        </Button>
        <Button
          variant="ghost"
          block
          className="text-error"
          onClick={() => setConfirming(true)}
          icon={<Trash2 size={22} />}
        >
          {P.delete}
        </Button>
      </div>

      <ConfirmDialog
        open={confirming}
        message={P.deleteConfirm}
        confirmLabel={P.delete}
        onCancel={() => setConfirming(false)}
        onConfirm={async () => {
          setConfirming(false);
          const undo = await softDeletePlot(plot);
          toast.show(P.deleted, () => void undo());
        }}
      />
      {toast.element}
    </div>
  );
}
