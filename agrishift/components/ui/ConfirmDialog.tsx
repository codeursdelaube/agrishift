"use client";

import { useEffect, useRef } from "react";
import { t } from "@/lib/i18n";

type ConfirmDialogProps = {
  open: boolean;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
};

/** Confirmation avant toute suppression (fenêtre modale native, accessible). */
export function ConfirmDialog({ open, message, confirmLabel, onConfirm, onCancel }: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog ref={ref} className="modal modal-bottom sm:modal-middle" onCancel={onCancel}>
      <div className="modal-box">
        <p className="text-xl font-bold">{message}</p>
        <div className="mt-6 flex flex-col gap-3">
          <button type="button" className="btn btn-error min-h-14 h-auto rounded-full text-lg" onClick={onConfirm}>
            {confirmLabel}
          </button>
          <button type="button" className="btn btn-ghost min-h-14 h-auto rounded-full text-lg" onClick={onCancel}>
            {t.common.cancel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
