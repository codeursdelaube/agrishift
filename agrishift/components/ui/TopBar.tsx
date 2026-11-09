"use client";

import { CircleCheck, CloudUpload, RefreshCw, Settings, WifiOff, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { SettingsPanel } from "@/components/settings/SettingsPanel";
import { usePendingCount, useOnline, useProfile } from "@/lib/hooks";
import { t } from "@/lib/i18n";
import { useSyncStatus } from "@/lib/sync";
import { getZone } from "@/lib/zones";

/** Indicateur de synchro permanent. */
function SyncIndicator() {
  const online = useOnline();
  const pending = usePendingCount();
  const { phase } = useSyncStatus();

  if (!online) {
    return (
      <span className="badge h-auto min-h-8 gap-1.5 bg-base-300 px-3 py-1 font-bold" role="status">
        <WifiOff aria-hidden="true" size={16} strokeWidth={2.5} />
        {t.sync.offline}
      </span>
    );
  }
  if (phase === "sending") {
    return (
      <span className="badge h-auto min-h-8 gap-1.5 bg-base-300 px-3 py-1 font-bold" role="status">
        <RefreshCw aria-hidden="true" size={16} strokeWidth={2.5} className="animate-spin" />
        {t.sync.sending}
      </span>
    );
  }
  if (phase === "error" && pending === 0) {
    return (
      <span className="badge badge-warning h-auto min-h-8 gap-1.5 px-3 py-1 font-bold" role="status">
        <CloudUpload aria-hidden="true" size={16} strokeWidth={2.5} />
        {t.sync.failed}
      </span>
    );
  }
  if (pending > 0) {
    return (
      <span className="badge badge-warning h-auto min-h-8 gap-1.5 px-3 py-1 font-bold" role="status">
        <CloudUpload aria-hidden="true" size={16} strokeWidth={2.5} />
        {t.sync.pending(pending)}
      </span>
    );
  }
  return (
    <span className="badge badge-success h-auto min-h-8 gap-1.5 px-3 py-1 font-bold" role="status">
      <CircleCheck aria-hidden="true" size={16} strokeWidth={2.5} />
      {t.sync.upToDate}
    </span>
  );
}

/** Fenêtre Paramètres, ouverte depuis la roue crantée. */
function SettingsButton() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label={t.nav.settings}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        className="btn btn-ghost btn-circle h-12 w-12"
      >
        <Settings aria-hidden="true" size={26} />
      </button>
      <dialog
        ref={ref}
        aria-labelledby="settings-title"
        className="modal modal-bottom sm:modal-middle"
        onClose={() => setOpen(false)}
      >
        <div className="modal-box flex max-h-[92dvh] flex-col gap-4 p-0">
          <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-base-300 bg-base-100 px-4 py-2">
            <h2 id="settings-title" className="text-2xl font-bold">
              {t.settings.title}
            </h2>
            <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost min-h-12 h-auto gap-2 rounded-full px-3">
              <X aria-hidden="true" size={24} />
              {t.common.close}
            </button>
          </div>
          <div className="px-4 pb-6">{open ? <SettingsPanel /> : null}</div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button aria-label={t.common.close}>{t.common.close}</button>
        </form>
      </dialog>
    </>
  );
}

/** Barre du haut : nom de la zone, synchro, Paramètres. */
export function TopBar() {
  const profile = useProfile();
  const zone = getZone(profile?.zone_id);

  return (
    <header className="sticky top-0 z-20 border-b border-base-300 bg-base-100">
      <div className="mx-auto flex max-w-xl items-center gap-2 px-4 py-2">
        <p className="min-w-0 flex-1 truncate text-lg font-bold">
          {zone ? zone.name_fr : t.app.shortName}
        </p>
        <SyncIndicator />
        <SettingsButton />
      </div>
    </header>
  );
}
