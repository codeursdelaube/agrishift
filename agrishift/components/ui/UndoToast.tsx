"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { t } from "@/lib/i18n";

type ToastState = { message: string; onUndo?: () => void } | null;

/** Toast simple avec bouton « Annuler » pendant 5 secondes. */
export function useUndoToast() {
  const [toast, setToast] = useState<ToastState>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((message: string, onUndo?: () => void) => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ message, onUndo });
    timer.current = setTimeout(() => setToast(null), 5000);
  }, []);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const element = toast ? (
    <div className="toast toast-center bottom-20 z-30 w-[calc(100%-2rem)] max-w-md" role="status">
      <div className="alert flex items-center justify-between gap-3 bg-neutral text-neutral-content">
        <span className="text-base">{toast.message}</span>
        {toast.onUndo ? (
          <button
            type="button"
            className="btn btn-sm min-h-12 h-auto rounded-full btn-primary"
            onClick={() => {
              toast.onUndo?.();
              setToast(null);
            }}
          >
            {t.toast.undo}
          </button>
        ) : null}
      </div>
    </div>
  ) : null;

  return { show, element };
}
