/**
 * Drapeau "déjà configuré". En phase F3 il sera aussi écrit dans Dexie (meta.onboarded) ;
 * on garde une copie dans localStorage pour que le landing statique puisse le lire vite.
 */
const KEY = "agrishift.onboarded";

export function isOnboarded(): boolean {
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function setOnboarded(value: boolean): void {
  try {
    if (value) window.localStorage.setItem(KEY, "1");
    else window.localStorage.removeItem(KEY);
  } catch {
    // Stockage indisponible (navigation privée) : on ignore.
  }
}
