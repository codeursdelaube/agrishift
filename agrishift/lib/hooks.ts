"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useSyncExternalStore } from "react";
import { db } from "./db";

function subscribeOnline(cb: () => void) {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
}

/** true si le navigateur pense être en ligne. */
export function useOnline(): boolean {
  return useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true);
}

/** Profil local, `undefined` pendant le chargement, `null` s'il n'existe pas. */
export function useProfile() {
  return useLiveQuery(async () => (await db.profile.get("me")) ?? null, []);
}

/** Champs non supprimés, du plus récent au plus ancien. */
export function usePlots() {
  return useLiveQuery(
    async () =>
      (await db.plots.orderBy("updated_at").reverse().toArray()).filter((p) => !p.deleted),
    [],
  );
}

/** Nombre d'éléments en attente d'envoi. */
export function usePendingCount() {
  return useLiveQuery(() => db.outbox.count(), [], 0);
}

/** Paquet d'une zone : `undefined` pendant le chargement, `null` s'il est absent. */
export function usePack(zoneId: string | undefined) {
  return useLiveQuery(
    async () => (zoneId ? ((await db.packs.get(zoneId))?.data ?? null) : null),
    [zoneId],
  );
}

export function usePlot(id: string) {
  return useLiveQuery(async () => (await db.plots.get(id)) ?? null, [id]);
}

/** Saisons d'un champ, de la plus récente à la plus ancienne. */
export function usePlotSeasons(plotId: string) {
  return useLiveQuery(
    async () =>
      (await db.plotSeasons.where("plot_id").equals(plotId).toArray())
        .filter((s) => !s.deleted)
        .sort((a, b) => b.updated_at.localeCompare(a.updated_at)),
    [plotId],
  );
}

/** Messages visibles d'une zone, du plus récent au plus ancien. */
export function usePosts(zoneId: string | undefined) {
  return useLiveQuery(
    async () =>
      zoneId
        ? (await db.posts.where("zone_id").equals(zoneId).toArray())
            .filter((p) => !p.deleted)
            .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
        : [],
    [zoneId],
  );
}

export function useForecast(zoneId: string | undefined) {
  return useLiveQuery(
    async () => (zoneId ? ((await db.forecast.get(zoneId)) ?? null) : null),
    [zoneId],
  );
}

export function useSummary(zoneId: string | undefined) {
  return useLiveQuery(
    async () => (zoneId ? ((await db.regionSummary.get(zoneId)) ?? null) : null),
    [zoneId],
  );
}

/** Lignes refusées par le serveur, pour les signaler dans Paramètres. */
export function useRejected() {
  return useLiveQuery(
    async () => {
      const refused = <T extends { sync_state: string; deleted: boolean }>(rows: T[]) =>
        rows.filter((r) => r.sync_state === "rejected" && !r.deleted);
      const [plots, seasons, posts] = await Promise.all([
        db.plots.toArray(),
        db.plotSeasons.toArray(),
        db.posts.toArray(),
      ]);
      return [...refused(plots), ...refused(seasons), ...refused(posts)];
    },
    [],
    [],
  );
}
