"use client";

import { liveQuery } from "dexie";
import { useSyncExternalStore } from "react";
import {
  ApiError,
  patchDevice,
  pullChanges,
  pushChanges,
  registerDevice,
  type Entity,
  type RejectedRow,
  type ServerPlot,
  type ServerPlotSeason,
  type ServerPost,
} from "./api";
import {
  db,
  getMeta,
  nowIso,
  setMeta,
  type OutboxRow,
  type PlotRow,
  type PlotSeasonRow,
  type PostRow,
  type ProfileRow,
} from "./db";

/**
 * Identité de l'appareil et synchronisation (API_FRONTEND §3.2, §3.3).
 * Le local fait foi : les écrans ne dépendent jamais de ce module pour s'afficher.
 */

export type SyncPhase = "idle" | "sending" | "error";
export type SyncStatus = { phase: SyncPhase; lastAt: string | null; clockWrong: boolean };

let status: SyncStatus = { phase: "idle", lastAt: null, clockWrong: false };
const listeners = new Set<() => void>();

function setStatus(patch: Partial<SyncStatus>) {
  status = { ...status, ...patch };
  listeners.forEach((l) => l());
}

export function useSyncStatus(): SyncStatus {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => status,
    () => status,
  );
}

const BATCH = 500;
const FIVE_MIN = 300_000;
const CLOCK_TOLERANCE_MS = 300_000;

async function resetDevice() {
  await db.meta.bulkDelete(["deviceId", "deviceToken", "apiCursor"]);
}

/** Enregistre l'appareil si besoin. Sans jeton, un 409 impose un nouvel UUID (§3.2). */
async function ensureDevice(profile: ProfileRow): Promise<string> {
  const existing = await getMeta<string>("deviceToken");
  if (existing) return existing;

  let deviceId = (await getMeta<string>("deviceId")) ?? crypto.randomUUID();
  for (let attempt = 0; ; attempt++) {
    await setMeta("deviceId", deviceId);
    try {
      const res = await registerDevice({
        device_id: deviceId,
        display_name: profile.display_name ?? null,
        zone_id: profile.zone_id,
        priority: profile.priority,
      });
      await setMeta("deviceToken", res.device_token);
      await db.meta.delete("profileDirty");
      return res.device_token;
    } catch (e) {
      if (e instanceof ApiError && e.code === "device_exists" && attempt === 0) {
        deviceId = crypto.randomUUID();
        continue;
      }
      throw e;
    }
  }
}

function tableOf(entity: Entity) {
  if (entity === "plots") return db.plots;
  if (entity === "plot_seasons") return db.plotSeasons;
  return db.posts;
}

function toPayload(entity: Entity, row: OutboxRow["row"]) {
  const base = { id: row.id, updated_at: row.updated_at, deleted: row.deleted };
  if (entity === "plots") {
    const p = row as PlotRow;
    return { ...base, zone_id: p.zone_id, name: p.name, area_ha: p.area_ha, soil_id: p.soil_id };
  }
  if (entity === "plot_seasons") {
    const s = row as PlotSeasonRow;
    return {
      ...base,
      plot_id: s.plot_id,
      season_label: s.season_label,
      crop_id: s.crop_id,
      sowing_date: s.sowing_date ?? null,
      yield_note: s.yield_note ?? null,
      losses_note: s.losses_note ?? null,
    };
  }
  const p = row as PostRow;
  return { ...base, zone_id: p.zone_id, body: p.body };
}

function mergePlot(row: ServerPlot, local?: PlotRow): PlotRow {
  return {
    id: row.id,
    zone_id: row.zone_id,
    name: row.name,
    area_ha: row.area_ha ?? local?.area_ha ?? 0.25,
    // Ces deux champs n'existent pas côté serveur : on garde la valeur locale.
    soil_id: row.soil_id ?? local?.soil_id ?? "sandy_loam",
    soil_assumed: row.soil_id ? local?.soil_assumed : true,
    previous_crop_id: local?.previous_crop_id ?? null,
    updated_at: row.updated_at,
    deleted: row.deleted,
    sync_state: "synced",
  };
}

function mergeSeason(row: ServerPlotSeason): PlotSeasonRow {
  return {
    id: row.id,
    plot_id: row.plot_id,
    season_label: row.season_label,
    crop_id: row.crop_id,
    ...(row.sowing_date ? { sowing_date: row.sowing_date } : {}),
    ...(row.yield_note ? { yield_note: row.yield_note } : {}),
    ...(row.losses_note ? { losses_note: row.losses_note } : {}),
    updated_at: row.updated_at,
    deleted: row.deleted,
    sync_state: "synced",
  };
}

function mergePost(row: ServerPost): PostRow {
  return {
    id: row.id,
    zone_id: row.zone_id,
    body: row.body,
    ...(row.author_name ? { author_name: row.author_name } : {}),
    updated_at: row.updated_at,
    deleted: row.deleted,
    is_mine: row.is_mine,
    sync_state: "synced",
  };
}

async function applyServerRow(entity: Entity, row: ServerPlot | ServerPlotSeason | ServerPost) {
  if (entity === "plots") {
    await db.plots.put(mergePlot(row as ServerPlot, await db.plots.get(row.id)));
  } else if (entity === "plot_seasons") {
    await db.plotSeasons.put(mergeSeason(row as ServerPlotSeason));
  } else {
    await db.posts.put(mergePost(row as ServerPost));
  }
}

async function applyPushResult(
  sent: Map<string, OutboxRow>,
  accepted: string[],
  rejected: RejectedRow[],
  batchEntries: OutboxRow[],
) {
  await db.transaction("rw", db.plots, db.plotSeasons, db.posts, db.outbox, async () => {
    for (const id of accepted) {
      const entry = sent.get(id);
      if (!entry) continue;
      await (tableOf(entry.entity) as typeof db.plots)
        .where("id")
        .equals(id)
        .and((row) => row.updated_at === entry.row.updated_at)
        .modify({ sync_state: "synced", sync_error: undefined });
    }
    for (const r of rejected) {
      const entry = sent.get(r.id);
      if (!entry) continue;
      const local = await tableOf(r.entity).get(r.id);
      // Une modification plus récente attend son tour : on ne l'écrase pas.
      if (!local || local.updated_at !== entry.row.updated_at) continue;
      if (r.reason === "stale" && r.server_row) {
        await applyServerRow(r.entity, r.server_row);
      } else {
        await tableOf(r.entity).update(r.id, { sync_state: "rejected", sync_error: r.reason });
      }
    }
    await db.outbox.bulkDelete(batchEntries.map((e) => e.seq as number));
  });
}

async function pushOutbox(token: string) {
  const entries = await db.outbox.orderBy("seq").toArray();
  if (entries.length === 0) return;

  // Plusieurs modifications d'une même ligne : seule la dernière part.
  const latest = new Map<string, OutboxRow>();
  for (const e of entries) latest.set(`${e.entity}:${e.row.id}`, e);
  const queues: Record<Entity, OutboxRow[]> = { plots: [], plot_seasons: [], posts: [] };
  for (const e of latest.values()) queues[e.entity].push(e);

  while (queues.plots.length + queues.plot_seasons.length + queues.posts.length > 0) {
    const plots = queues.plots.splice(0, BATCH);
    // Une saison doit partir avec sa parcelle ou après elle (§3.3).
    const seasons = queues.plots.length > 0 ? [] : queues.plot_seasons.splice(0, BATCH);
    const posts = queues.posts.splice(0, BATCH);
    const batch = [...plots, ...seasons, ...posts];

    const res = await pushChanges(token, {
      plots: plots.map((e) => toPayload("plots", e.row)),
      plot_seasons: seasons.map((e) => toPayload("plot_seasons", e.row)),
      posts: posts.map((e) => toPayload("posts", e.row)),
    });

    const sent = new Map(batch.map((e) => [e.row.id, e]));
    const lastSeq = new Map(batch.map((e) => [`${e.entity}:${e.row.id}`, e.seq as number]));
    const covered = entries.filter((e) => {
      const seq = lastSeq.get(`${e.entity}:${e.row.id}`);
      return seq !== undefined && (e.seq as number) <= seq;
    });
    await applyPushResult(sent, res.accepted, res.rejected, covered);
  }
}

/** Une ligne locale plus récente, pas encore envoyée, n'est jamais écrasée. */
function keepLocal(local: { sync_state: string; updated_at: string } | undefined, updatedAt: string) {
  return !!local && local.sync_state === "pending" && local.updated_at > updatedAt;
}

async function pull(token: string) {
  let since = await getMeta<string>("apiCursor");
  for (;;) {
    const res = await pullChanges(token, since);
    await db.transaction("rw", db.plots, db.plotSeasons, db.posts, async () => {
      for (const row of res.changes.plots) {
        if (!keepLocal(await db.plots.get(row.id), row.updated_at)) await applyServerRow("plots", row);
      }
      for (const row of res.changes.plot_seasons) {
        if (!keepLocal(await db.plotSeasons.get(row.id), row.updated_at)) {
          await applyServerRow("plot_seasons", row);
        }
      }
      for (const row of res.changes.posts) {
        if (!keepLocal(await db.posts.get(row.id), row.updated_at)) await applyServerRow("posts", row);
      }
    });
    if (res.next_since) {
      since = res.next_since;
      continue;
    }
    await setMeta("apiCursor", res.server_time);
    const skew = Math.abs(Date.now() - new Date(res.server_time).getTime());
    setStatus({ clockWrong: skew > CLOCK_TOLERANCE_MS });
    return;
  }
}

async function cycle(profile: ProfileRow, canRetry: boolean): Promise<void> {
  const token = await ensureDevice(profile);
  try {
    if (await getMeta<boolean>("profileDirty")) {
      await patchDevice(token, {
        display_name: profile.display_name ?? null,
        zone_id: profile.zone_id,
        priority: profile.priority,
      });
      await db.meta.delete("profileDirty");
    }
    await pushOutbox(token);
    await pull(token);
  } catch (e) {
    if (e instanceof ApiError && e.status === 401 && canRetry) {
      await resetDevice();
      return cycle(profile, false);
    }
    throw e;
  }
}

let running: Promise<void> | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
let failures = 0;

function schedule(delay: number) {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => void syncNow(), delay);
}

export function syncNow(): Promise<void> {
  if (running) return running;
  running = (async () => {
    if (!navigator.onLine) return;
    const profile = await db.profile.get("me");
    if (!profile) return;
    setStatus({ phase: "sending" });
    try {
      await cycle(profile, true);
      failures = 0;
      setStatus({ phase: "idle", lastAt: nowIso() });
    } catch (e) {
      failures += 1;
      setStatus({ phase: "error" });
      const rateLimited = e instanceof ApiError && e.status === 429;
      schedule(rateLimited ? 60_000 : Math.min(FIVE_MIN, 15_000 * 2 ** (failures - 1)));
    }
  })().finally(() => {
    running = null;
  });
  return running;
}

/** Lance la synchro : démarrage, retour du réseau, nouvelle écriture, toutes les 5 min. */
export function startSync(): () => void {
  void syncNow();
  const onOnline = () => void syncNow();
  window.addEventListener("online", onOnline);
  const interval = setInterval(() => {
    if (document.visibilityState === "visible") void syncNow();
  }, FIVE_MIN);

  let previous = -1;
  const subscription = liveQuery(() => db.outbox.count()).subscribe({
    next: (count) => {
      if (previous >= 0 && count > previous) schedule(800);
      previous = count;
    },
    error: () => {},
  });

  return () => {
    window.removeEventListener("online", onOnline);
    clearInterval(interval);
    subscription.unsubscribe();
    if (timer) clearTimeout(timer);
  };
}
