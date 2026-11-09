"use client";

import { Clock } from "lucide-react";
import { useEffect } from "react";
import { usePlots } from "@/lib/hooks";
import { t } from "@/lib/i18n";
import { refreshPacks, seedAllPacks } from "@/lib/packs";
import { startSync, useSyncStatus } from "@/lib/sync";

/** Travail de fond de l'application : paquets, synchronisation. Ne bloque aucun écran. */
export function AppRuntime() {
  const { clockWrong } = useSyncStatus();
  const plots = usePlots();
  const plotIds = plots?.map((p) => p.id).join(",") ?? "";

  useEffect(() => {
    const update = () => void refreshPacks().catch(() => {});
    void seedAllPacks().then(update);
    window.addEventListener("online", update);
    const stop = startSync();
    return () => {
      window.removeEventListener("online", update);
      stop();
    };
  }, []);

  // Garde hors ligne les pages de chaque champ, dès qu'il existe.
  useEffect(() => {
    if (!plotIds || !navigator.onLine || !("serviceWorker" in navigator)) return;
    let cancelled = false;
    void navigator.serviceWorker.ready.then((registration) => {
      if (cancelled) return;
      registration.active?.postMessage({
        type: "cache-pages",
        urls: plotIds
          .split(",")
          .flatMap((id) => [`/parcelles/${id}`, `/conseil/${id}`, `/conseil/${id}/detail`]),
      });
    });
    return () => {
      cancelled = true;
    };
  }, [plotIds]);

  if (!clockWrong) return null;
  return (
    <p role="alert" className="flex items-start gap-2 bg-warning px-4 py-2 font-bold text-warning-content">
      <Clock aria-hidden="true" size={20} className="mt-1 shrink-0" />
      {t.sync.clockWrong}
    </p>
  );
}
