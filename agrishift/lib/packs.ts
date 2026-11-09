import { z } from "zod";
import type { ZonePack } from "@/engine/types";
import { fetchPackBytes, getManifest } from "./api";
import { db, getMeta, nowIso, setMeta } from "./db";
import { ZONES } from "./zones";

/**
 * Paquets de zone (API_FRONTEND §3.1). Un paquet invalide est rejeté et l'ancien conservé.
 * Sans réseau, on repart de la copie livrée avec l'application (public/packs/).
 */

const sourceType = z.enum([
  "nasa_power",
  "public_historical_reanalysis",
  "provisional_demo",
  "synthetic_demo",
  "synthetic_scenario",
  "computed",
]);

const zonePackSchema = z.looseObject({
  schema_version: z.literal(1),
  pack_version: z.string(),
  generated_at: z.string(),
  zone: z.looseObject({
    zone_id: z.string(),
    name_fr: z.string(),
    latitude: z.number(),
    longitude: z.number(),
    seasons: z
      .array(z.looseObject({ season_id: z.string(), label_fr: z.string(), sowing_dekad: z.number().int() }))
      .min(1),
    coordinate_note: z.string(),
  }),
  climate: z.looseObject({
    source_type: sourceType,
    source_name: z.string(),
    baseline_period: z.string(),
    dekads: z
      .array(
        z.looseObject({
          dekad: z.number().int().min(1).max(36),
          label_fr: z.string(),
          p_mm: z.number(),
          et0_mm: z.number(),
          tmean_c: z.number(),
        }),
      )
      .length(36),
    warnings_fr: z.array(z.string()),
  }),
  crops: z.array(z.looseObject({ crop_id: z.string(), cycle_days: z.number().positive() })).min(1),
  soils: z.array(z.looseObject({ soil_id: z.string(), taw_mm_per_m: z.number() })).min(1),
  rules: z.array(z.looseObject({ rule_id: z.string(), delta: z.number(), all: z.array(z.unknown()) })),
  scenarios: z.array(z.looseObject({ scenario_id: z.string() })).min(1),
  scoring: z.looseObject({ top_n: z.number().int(), horizon_max: z.number().int() }),
  data_provenance: z.array(z.unknown()),
});

export function parsePack(value: unknown): ZonePack {
  return zonePackSchema.parse(value) as unknown as ZonePack;
}

async function sha256Hex(bytes: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function storeBytes(bytes: ArrayBuffer, expectedSha?: string): Promise<void> {
  const sha256 = await sha256Hex(bytes);
  if (expectedSha && sha256 !== expectedSha) throw new Error("Empreinte du paquet incorrecte");
  const data = parsePack(JSON.parse(new TextDecoder().decode(bytes)));
  await db.packs.put({
    zone_id: data.zone.zone_id,
    pack_version: data.pack_version,
    sha256,
    data,
    fetched_at: nowIso(),
  });
}

/** Copie de secours : garantit qu'une zone a un paquet, même sans réseau. */
export async function seedPack(zoneId: string): Promise<void> {
  if (await db.packs.get(zoneId)) return;
  const res = await fetch(`/packs/${zoneId}.json`);
  if (!res.ok) throw new Error(`Copie de secours absente : ${zoneId}`);
  await storeBytes(await res.arrayBuffer());
}

export async function seedAllPacks(): Promise<void> {
  await Promise.allSettled(ZONES.map((z) => seedPack(z.zone_id)));
}

const HOUR = 3_600_000;

/** Compare au manifest et télécharge ce qui a changé, au plus une fois par heure. */
export async function refreshPacks(force = false): Promise<void> {
  if (!navigator.onLine) return;
  const last = await getMeta<number>("manifestCheckedAt");
  if (!force && last && Date.now() - last < HOUR) return;

  const manifest = await getManifest();
  await Promise.allSettled(
    manifest.map(async (entry) => {
      const local = await db.packs.get(entry.zone_id);
      if (local?.sha256 === entry.sha256) return;
      const bytes = await fetchPackBytes(entry.zone_id, local?.sha256);
      if (bytes) await storeBytes(bytes, entry.sha256);
    }),
  );
  await setMeta("manifestCheckedAt", Date.now());
}

/** Prépare la zone choisie à l'installation ; le réseau n'est jamais bloquant. */
export async function preparePacks(zoneId: string, onProgress: (ratio: number) => void): Promise<void> {
  onProgress(0.15);
  try {
    await seedPack(zoneId);
  } catch {
    // Le paquet viendra du réseau à l'étape suivante.
  }
  onProgress(0.5);
  await Promise.allSettled([refreshPacks(true), seedAllPacks()]);
  onProgress(1);
}
