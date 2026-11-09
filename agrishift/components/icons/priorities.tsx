import { Pictogram, type PictogramProps } from "./Pictogram";

/** Nourrir ma famille : bol fumant. */
export function BowlIcon(props: PictogramProps) {
  return (
    <Pictogram {...props}>
      <path d="M6 24h36c0 10-8 16-18 16S6 34 6 24Z" />
      <path d="M16 40l-2 4h20l-2-4" />
      <path d="M18 18c-2-3 2-5 0-8M24 18c-2-3 2-5 0-8M30 18c-2-3 2-5 0-8" strokeWidth={2.5} />
    </Pictogram>
  );
}

/** Résister à la sécheresse : bouclier avec une goutte. */
export function DropShieldIcon(props: PictogramProps) {
  return (
    <Pictogram {...props}>
      <path d="M24 4l16 6v12c0 10-7 18-16 22C15 40 8 32 8 22V10Z" />
      <path d="M24 15c-3 4-6 7-6 10.5a6 6 0 0 0 12 0C30 22 27 19 24 15Z" />
    </Pictogram>
  );
}

/** Un peu des deux : balance équilibrée. */
export function BalanceIcon(props: PictogramProps) {
  return (
    <Pictogram {...props}>
      <path d="M24 6v34M14 42h20M10 12h28" />
      <circle cx="24" cy="8" r="2" fill="currentColor" />
      <path d="M10 12l-6 14h12ZM38 12l-6 14h12Z" />
      <path d="M4 26a6 4 0 0 0 12 0M32 26a6 4 0 0 0 12 0" />
    </Pictogram>
  );
}

export const priorityIcons = {
  food_security: BowlIcon,
  drought_resilience: DropShieldIcon,
  balanced: BalanceIcon,
} as const;
