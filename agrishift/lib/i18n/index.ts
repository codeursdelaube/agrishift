import { fr, type Dictionary } from "./fr";
import { ee } from "./ee";
import { kbp } from "./kbp";

export type Locale = "fr" | "ee" | "kbp";

type DeepPartial<T> = T extends (...args: never[]) => unknown
  ? T
  : T extends readonly unknown[]
    ? T
    : T extends object
      ? { [K in keyof T]?: DeepPartial<T[K]> }
      : T;

export type PartialDictionary = DeepPartial<Dictionary>;

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function merge<T>(base: T, override: unknown): T {
  if (!isPlainObject(base) || !isPlainObject(override)) {
    return (override ?? base) as T;
  }
  const out: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(override)) {
    if (value !== undefined) out[key] = merge(out[key], value);
  }
  return out as T;
}

const partials: Record<Locale, PartialDictionary> = { fr: {}, ee, kbp };

/** Dictionnaire d'une langue, avec repli sur le français pour les clés manquantes. */
export function getDictionary(locale: Locale = "fr"): Dictionary {
  return locale === "fr" ? fr : merge(fr, partials[locale]);
}

/** Dictionnaire par défaut (français). */
export const t = fr;
