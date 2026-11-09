import { Pictogram, type PictogramProps } from "./Pictogram";

/** Sableux : grains qui coulent d'une main. */
export function SandySoilIcon(props: PictogramProps) {
  return (
    <Pictogram {...props}>
      <path d="M8 14c6-4 14-6 22-4l8 2c3 1 3 5 0 5H26" />
      <path d="M8 14v8c4 2 10 2 14 0" />
      <g fill="currentColor" stroke="none">
        <circle cx="22" cy="28" r="1.8" />
        <circle cx="26" cy="33" r="1.8" />
        <circle cx="20" cy="36" r="1.8" />
        <circle cx="24" cy="40" r="1.8" />
        <circle cx="29" cy="39" r="1.8" />
        <circle cx="17" cy="42" r="1.8" />
      </g>
    </Pictogram>
  );
}

/** Sablo-limoneux : boule qui s'effrite. */
export function SandyLoamSoilIcon(props: PictogramProps) {
  return (
    <Pictogram {...props}>
      <path d="M30 12a12 12 0 1 0 4 18" />
      <path d="M36 18l4-2M37 25h5M34 31l4 3" strokeWidth={2.5} />
      <g fill="currentColor" stroke="none">
        <circle cx="40" cy="40" r="1.8" />
        <circle cx="34" cy="42" r="1.8" />
      </g>
    </Pictogram>
  );
}

/** Limoneux : poudre douce comme la farine, en petit tas. */
export function LoamSoilIcon(props: PictogramProps) {
  return (
    <Pictogram {...props}>
      <path d="M6 38c4-12 10-20 18-20s14 8 18 20Z" />
      <path d="M14 30c3-1 5-1 8 0M26 26c3-1 5-1 8 0M20 34c3-1 5-1 8 0" strokeWidth={2.5} />
      <path d="M24 8v4M17 10l2 3M31 10l-2 3" strokeWidth={2.5} />
    </Pictogram>
  );
}

/** Argileux : boudin collant et plié. */
export function ClaySoilIcon(props: PictogramProps) {
  return (
    <Pictogram {...props}>
      <path d="M8 30c0-6 6-8 12-8h10c4 0 6-2 6-5" strokeWidth={7} />
      <path d="M8 30c0-6 6-8 12-8h10c4 0 6-2 6-5" stroke="var(--color-base-100, #fff)" strokeWidth={2} />
      <path d="M10 40h28" />
    </Pictogram>
  );
}

/** Je ne sais pas : point d'interrogation dans un cercle. */
export function UnknownIcon(props: PictogramProps) {
  return (
    <Pictogram {...props}>
      <circle cx="24" cy="24" r="18" />
      <path d="M18 19a6 6 0 1 1 8 5.6c-1.4.6-2 1.6-2 3V30" />
      <circle cx="24" cy="36" r="1" fill="currentColor" />
    </Pictogram>
  );
}

export const soilIcons = {
  sandy: SandySoilIcon,
  sandy_loam: SandyLoamSoilIcon,
  loam: LoamSoilIcon,
  clay: ClaySoilIcon,
} as const;

export type SoilIconId = keyof typeof soilIcons;
