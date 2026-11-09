import Dexie, { type EntityTable } from "dexie";
import type { ZonePack } from "@/engine/types";
import type { Priority } from "./types";

export type SyncState = "pending" | "synced" | "rejected";

export interface MetaRow {
  key: string;
  value: unknown;
}

export interface PackRow {
  zone_id: string;
  pack_version: string;
  sha256: string;
  /** Paquet validé par lib/packs.ts. */
  data: ZonePack;
  fetched_at: string;
}

export interface ProfileRow {
  id: "me";
  display_name?: string;
  zone_id: string;
  priority: Priority;
}

export interface PlotRow {
  id: string;
  zone_id: string;
  name: string;
  area_ha: number;
  soil_id: string;
  /** true si l'utilisateur a répondu « Je ne sais pas » (sol supposé). */
  soil_assumed?: boolean;
  /** null = « Je ne sais pas » ; "fallow" = rien / jachère. */
  previous_crop_id: string | null;
  updated_at: string;
  deleted: boolean;
  sync_state: SyncState;
  /** Raison du refus par le serveur (code `reason`), si sync_state = "rejected". */
  sync_error?: string;
}

export interface PlotSeasonRow {
  id: string;
  plot_id: string;
  season_label: string;
  crop_id: string | null;
  sowing_date?: string;
  yield_note?: string;
  losses_note?: string;
  updated_at: string;
  deleted: boolean;
  sync_state: SyncState;
  sync_error?: string;
}

export interface PostRow {
  id: string;
  zone_id: string;
  body: string;
  author_name?: string;
  updated_at: string;
  deleted: boolean;
  is_mine: boolean;
  sync_state: SyncState;
  sync_error?: string;
}

export interface OutboxRow {
  seq?: number;
  entity: "plots" | "plot_seasons" | "posts";
  row: PlotRow | PlotSeasonRow | PostRow;
  created_at: string;
  attempts: number;
}

export interface CacheRow {
  zone_id: string;
  fetched_at: string;
  data: unknown;
}

/** Base locale (§6.2). Le local fait foi ; la synchro passe par l'outbox. */
export const db = new Dexie("agrishift") as Dexie & {
  meta: EntityTable<MetaRow, "key">;
  packs: EntityTable<PackRow, "zone_id">;
  profile: EntityTable<ProfileRow, "id">;
  plots: EntityTable<PlotRow, "id">;
  plotSeasons: EntityTable<PlotSeasonRow, "id">;
  posts: EntityTable<PostRow, "id">;
  outbox: EntityTable<OutboxRow, "seq">;
  forecast: EntityTable<CacheRow, "zone_id">;
  regionSummary: EntityTable<CacheRow, "zone_id">;
};

db.version(1).stores({
  meta: "&key",
  packs: "&zone_id, pack_version",
  profile: "&id",
  plots: "&id, zone_id, updated_at",
  plotSeasons: "&id, plot_id, updated_at",
  posts: "&id, zone_id, updated_at, is_mine",
  outbox: "++seq, entity, created_at",
  forecast: "&zone_id",
  regionSummary: "&zone_id",
});

export const nowIso = () => new Date().toISOString();

/** Écrit la ligne en local ET l'ajoute à l'outbox, dans une même transaction. */
export async function saveWithOutbox(
  entity: OutboxRow["entity"],
  row: PlotRow | PlotSeasonRow | PostRow,
): Promise<void> {
  const table = entity === "plots" ? db.plots : entity === "plot_seasons" ? db.plotSeasons : db.posts;
  await db.transaction("rw", table, db.outbox, async () => {
    await (table as typeof db.plots).put(row as PlotRow);
    await db.outbox.add({ entity, row, created_at: nowIso(), attempts: 0 });
  });
}

export async function getMeta<T>(key: string): Promise<T | undefined> {
  return (await db.meta.get(key))?.value as T | undefined;
}

export async function setMeta(key: string, value: unknown): Promise<void> {
  await db.meta.put({ key, value });
}
