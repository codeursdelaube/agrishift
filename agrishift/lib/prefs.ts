"use client";

import { useSyncExternalStore } from "react";

/**
 * Préférences d'affichage, propres à ce téléphone. Gardées dans localStorage
 * pour être appliquées avant le premier affichage (script dans app/layout.tsx).
 */
export type TextScale = "md" | "lg" | "xl";
export type Theme = "agrishift" | "agrishift-dark";

const KEYS = {
  textScale: "agrishift.textScale",
  theme: "agrishift.theme",
  voice: "agrishift.voice",
} as const;

const listeners = new Set<() => void>();

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Stockage indisponible : la préférence ne vaut que pour cette visite.
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getTextScale(): TextScale {
  const v = read(KEYS.textScale);
  return v === "lg" || v === "xl" ? v : "md";
}

export function setTextScale(scale: TextScale) {
  const root = document.documentElement;
  if (scale === "md") delete root.dataset.textScale;
  else root.dataset.textScale = scale;
  write(KEYS.textScale, scale);
}

export function getTheme(): Theme {
  return read(KEYS.theme) === "agrishift-dark" ? "agrishift-dark" : "agrishift";
}

export function setTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", theme === "agrishift-dark" ? "#171b18" : "#2f7d32");
  write(KEYS.theme, theme);
}

export function getVoiceOn(): boolean {
  return read(KEYS.voice) !== "0";
}

export function setVoiceOn(on: boolean) {
  write(KEYS.voice, on ? "1" : "0");
}

export function useTextScale() {
  return useSyncExternalStore(subscribe, getTextScale, () => "md" as TextScale);
}

export function useTheme() {
  return useSyncExternalStore(subscribe, getTheme, () => "agrishift" as Theme);
}

export function useVoiceOn() {
  return useSyncExternalStore(subscribe, getVoiceOn, () => true);
}

/** Efface les préférences (utilisé par « Effacer mes données »). */
export function resetPrefs() {
  setTextScale("md");
  setTheme("agrishift");
  try {
    window.localStorage.removeItem(KEYS.voice);
  } catch {
    // ignore
  }
  listeners.forEach((l) => l());
}
