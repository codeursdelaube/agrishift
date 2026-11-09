import type { PackSeason, Priority, SourceType, ZonePack } from "@/engine/types";

/** Client HTTP typé de l'API (API_FRONTEND §2). Le jeton n'est jamais journalisé. */

const HOST = (process.env.NEXT_PUBLIC_API_URL ?? "https://agri-shift-api.fastapicloud.dev").replace(/\/$/, "");
export const API_BASE = `${HOST}/api/v1`;

const TIMEOUT_MS = 10_000;

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export interface ManifestEntry {
  zone_id: string;
  pack_version: string;
  sha256: string;
  size_bytes: number;
  url: string;
}

export interface ServerRowBase {
  id: string;
  updated_at: string;
  deleted: boolean;
  server_updated_at: string;
}

export interface ServerPlot extends ServerRowBase {
  zone_id: string;
  name: string;
  area_ha: number | null;
  soil_id: string | null;
}

export interface ServerPlotSeason extends ServerRowBase {
  plot_id: string;
  season_label: string;
  crop_id: string | null;
  sowing_date: string | null;
  yield_note: string | null;
  losses_note: string | null;
}

export interface PublicPost extends ServerRowBase {
  zone_id: string;
  body: string;
  author_name: string | null;
}

export interface ServerPost extends PublicPost {
  is_mine: boolean;
}

export type Entity = "plots" | "plot_seasons" | "posts";

export interface RejectedRow {
  id: string;
  entity: Entity;
  reason: string;
  message_fr: string;
  server_row: (ServerPlot | ServerPlotSeason | ServerPost) | null;
}

export interface PushChanges {
  plots?: unknown[];
  plot_seasons?: unknown[];
  posts?: unknown[];
}

export interface PushResponse {
  accepted: string[];
  rejected: RejectedRow[];
  server_time: string;
}

export interface PullResponse {
  changes: { plots: ServerPlot[]; plot_seasons: ServerPlotSeason[]; posts: ServerPost[] };
  server_time: string;
  next_since: string | null;
}

export interface ZoneSummary {
  zone_id: string;
  name_fr: string;
  region: string;
  climate: {
    source_type: SourceType;
    source_name: string;
    baseline_period: string;
    annual_p_mm: number;
    annual_et0_mm: number;
    mean_tmean_c: number;
    wettest_dekad: { dekad: number; label_fr: string; p_mm: number };
    warnings_fr: string[];
    seasons: PackSeason[];
  } | null;
  producers: {
    n_plots: number;
    anonymity_threshold: number;
    crops_by_season: {
      season_label: string;
      crops: { crop_id: string; name_fr: string; n_plots: number }[];
    }[];
    note_fr: string;
  };
  recent_posts: PublicPost[];
}

export interface DeviceProfilePatch {
  display_name?: string | null;
  zone_id?: string | null;
  priority?: Priority | null;
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: string;
  headers?: Record<string, string>;
};

async function send(path: string, options: RequestOptions): Promise<Response> {
  const headers: Record<string, string> = { ...options.headers };
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (options.token) headers["X-Device-Token"] = options.token;

  const attempt = () =>
    fetch(`${API_BASE}${path}`, {
      method: options.method ?? "GET",
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
    });

  try {
    return await attempt();
  } catch {
    // Toutes nos requêtes peuvent être rejouées sans risque (§3.3) : un seul nouvel essai.
    return attempt();
  }
}

async function failure(res: Response): Promise<ApiError> {
  try {
    const { error } = (await res.json()) as { error: { code: string; message_fr: string } };
    return new ApiError(res.status, error.code, error.message_fr);
  } catch {
    return new ApiError(res.status, "http_error", "Le service ne répond pas correctement.");
  }
}

async function json<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const res = await send(path, options);
  if (!res.ok) throw await failure(res);
  return (await res.json()) as T;
}

export const getManifest = () => json<ManifestEntry[]>("/packs/manifest");

/** Renvoie null sur un 304 ; sinon les octets du paquet, pour contrôler l'empreinte. */
export async function fetchPackBytes(zoneId: string, localSha?: string): Promise<ArrayBuffer | null> {
  const res = await send(`/packs/${encodeURIComponent(zoneId)}`, {
    headers: localSha ? { "If-None-Match": `"${localSha}"` } : {},
  });
  if (res.status === 304) return null;
  if (!res.ok) throw await failure(res);
  return res.arrayBuffer();
}

export const registerDevice = (body: {
  device_id: string;
  display_name: string | null;
  zone_id: string;
  priority: Priority;
}) =>
  json<{ device_id: string; device_token: string }>("/devices/register", { method: "POST", body });

export const patchDevice = (token: string, body: DeviceProfilePatch) =>
  json<unknown>("/devices/me", { method: "PATCH", token, body });

export const pushChanges = (token: string, changes: PushChanges) =>
  json<PushResponse>("/sync/push", { method: "POST", token, body: { changes } });

export const pullChanges = (token: string, since?: string) =>
  json<PullResponse>(`/sync/pull${since ? `?since=${encodeURIComponent(since)}` : ""}`, { token });

export const getZoneSummary = (zoneId: string) =>
  json<ZoneSummary>(`/zones/${encodeURIComponent(zoneId)}/summary`);

export const getPosts = (zoneId: string, before?: string | null, limit = 20) => {
  const params = new URLSearchParams({ zone_id: zoneId, limit: String(limit) });
  if (before) params.set("before", before);
  return json<{ posts: PublicPost[]; next_before: string | null }>(`/posts?${params}`);
};

export type { ZonePack };
