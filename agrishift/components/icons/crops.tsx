import { Pictogram, type PictogramProps } from "./Pictogram";

/** Maïs : épi avec grains et deux feuilles. */
export function MaizeIcon(props: PictogramProps) {
  return (
    <Pictogram {...props}>
      <path d="M24 6c5 0 8 6 8 15s-3 17-8 17-8-8-8-17 3-15 8-15Z" />
      <path d="M20 14h8M19 20h10M19 26h10M20 32h8" strokeWidth={2.5} />
      <path d="M16 30c-6-2-9-7-9-13 5 2 8 6 9 10" />
      <path d="M32 30c6-2 9-7 9-13-5 2-8 6-9 10" />
      <path d="M24 38v6" />
    </Pictogram>
  );
}

/** Sorgho : panicule de grains ronds en haut d'une tige. */
export function SorghumIcon(props: PictogramProps) {
  return (
    <Pictogram {...props}>
      <path d="M24 22v22" />
      <path d="M24 32c-5-1-9-4-10-9M24 36c5-1 9-4 10-9" />
      <circle cx="24" cy="7" r="3" />
      <circle cx="19" cy="12" r="3" />
      <circle cx="29" cy="12" r="3" />
      <circle cx="21" cy="18" r="3" />
      <circle cx="27" cy="18" r="3" />
    </Pictogram>
  );
}

/** Riz : tige courbée par des grains allongés, pieds dans l'eau. */
export function RiceIcon(props: PictogramProps) {
  return (
    <Pictogram {...props}>
      <path d="M22 38c0-14 4-24 14-30" />
      <path d="M30 12c-3 0-5-2-5-4M33 17c-3 0-5-2-5-4M27 18c-3 0-5-2-5-4M30 23c-3 0-5-2-5-4" />
      <path d="M22 30c-4-3-8-4-12-3" />
      <path d="M6 42c3-2 6-2 9 0s6 2 9 0 6-2 9 0 6 2 9 0" />
    </Pictogram>
  );
}

/** Arachide : coque en forme de huit avec ses rainures. */
export function GroundnutIcon(props: PictogramProps) {
  return (
    <Pictogram {...props}>
      <path d="M24 5c6 0 10 4 10 9 0 4-3 6-3 10s3 6 3 10c0 5-4 9-10 9s-10-4-10-9c0-4 3-6 3-10s-3-6-3-10c0-5 4-9 10-9Z" />
      <path d="M20 13h8M20 34h8" strokeWidth={2.5} />
      <path d="M24 20v8" strokeWidth={2.5} strokeDasharray="1 4" />
    </Pictogram>
  );
}

/** Niébé : gousse courbe avec ses haricots. */
export function CowpeaIcon(props: PictogramProps) {
  return (
    <Pictogram {...props}>
      <path d="M8 38C14 22 26 10 40 8c0 14-12 28-30 32Z" />
      <circle cx="16" cy="31" r="2.5" />
      <circle cx="22" cy="25" r="2.5" />
      <circle cx="28" cy="19" r="2.5" />
      <circle cx="34" cy="13" r="2.5" />
      <path d="M40 8l4-4" />
    </Pictogram>
  );
}

/** Jachère / rien : terre au repos avec une petite pousse. */
export function FallowIcon(props: PictogramProps) {
  return (
    <Pictogram {...props}>
      <path d="M4 34h40" />
      <path d="M8 40h8M22 40h10M38 40h4" strokeWidth={2.5} />
      <path d="M24 34v-8" />
      <path d="M24 28c-4 0-6-3-6-6 4 0 6 3 6 6ZM24 26c0-4 3-6 6-6 0 4-3 6-6 6Z" />
    </Pictogram>
  );
}

export const cropIcons = {
  maize: MaizeIcon,
  sorghum: SorghumIcon,
  rice: RiceIcon,
  groundnut: GroundnutIcon,
  cowpea: CowpeaIcon,
} as const;

export type CropIconId = keyof typeof cropIcons;
