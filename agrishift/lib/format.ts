/** Affichage lisible : décades en mots, dates relatives, nombres arrondis. */

const MONTHS: Record<string, string> = {
  "janv.": "janvier",
  "févr.": "février",
  mars: "mars",
  "avr.": "avril",
  mai: "mai",
  juin: "juin",
  "juil.": "juillet",
  août: "août",
  "sept.": "septembre",
  "oct.": "octobre",
  "nov.": "novembre",
  "déc.": "décembre",
};

const MONTH_NAMES = Object.values(MONTHS);
export const MONTH_SHORT = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

function dekadPart(part: 1 | 2 | 3, month: string): string {
  if (part === 1) return `début ${month}`;
  if (part === 2) return `mi-${month}`;
  return `fin ${month}`;
}

/** « août D3 » → « fin août ». */
export function friendlyDekad(label: string): string {
  const match = /^(\S+) D([123])$/.exec(label);
  if (!match) return label;
  return dekadPart(Number(match[2]) as 1 | 2 | 3, MONTHS[match[1]] ?? match[1]);
}

/** Décade 1..36 → « début juillet ». */
export function dekadLabel(dekad: number): string {
  const month = Math.floor((dekad - 1) / 3);
  const part = ((dekad - 1) % 3) + 1;
  return dekadPart(part as 1 | 2 | 3, MONTH_NAMES[month]);
}

export function dekadOf(date: Date): number {
  const day = date.getDate();
  return date.getMonth() * 3 + (day <= 10 ? 1 : day <= 20 ? 2 : 3);
}

/** Décade suivante, en bouclant après 36. */
export function addDekads(dekad: number, n: number): number {
  return ((dekad - 1 + n) % 36) + 1;
}

export function relativeFr(iso: string, now = Date.now()): string {
  const minutes = Math.floor((now - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "hier" : `il y a ${days} jours`;
}

export function olderThan(iso: string, ms: number): boolean {
  return Date.now() - new Date(iso).getTime() > ms;
}

export function dayNameFr(isoDate: string): string {
  const name = new Date(`${isoDate}T12:00:00`).toLocaleDateString("fr-FR", { weekday: "long" });
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export const n0 = (x: number) => Math.round(x).toLocaleString("fr-FR");
export const n1 = (x: number) => x.toLocaleString("fr-FR", { maximumFractionDigits: 1 });
