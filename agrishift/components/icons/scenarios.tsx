import { Pictogram, type PictogramProps } from "./Pictogram";

/** Année normale : soleil. */
export function SunIcon(props: PictogramProps) {
  return (
    <Pictogram {...props}>
      <circle cx="24" cy="24" r="8" />
      <path d="M24 4v6M24 38v6M4 24h6M38 24h6M10 10l4 4M34 34l4 4M38 10l-4 4M14 34l-4 4" />
    </Pictogram>
  );
}

/** Moins de pluie : nuage et goutte barrée. */
export function DryCloudIcon(props: PictogramProps) {
  return (
    <Pictogram {...props}>
      <path d="M14 26h20a7 7 0 0 0 0-14 10 10 0 0 0-19-1 7.5 7.5 0 0 0-1 15Z" />
      <path d="M24 31c-3 4-5 6-5 8.5a5 5 0 0 0 10 0c0-2.5-2-4.5-5-8.5Z" />
      <path d="M16 46l16-16" />
    </Pictogram>
  );
}

/** Plus chaud : thermomètre. */
export function ThermometerIcon(props: PictogramProps) {
  return (
    <Pictogram {...props}>
      <path d="M20 28V10a4 4 0 0 1 8 0v18a8 8 0 1 1-8 0Z" />
      <circle cx="24" cy="34" r="3" fill="currentColor" />
      <path d="M24 31V16" />
      <path d="M34 12h6M34 18h4M34 24h6" strokeWidth={2.5} />
    </Pictogram>
  );
}

/** Pluie (pour les illustrations et la météo). */
export function RainIcon(props: PictogramProps) {
  return (
    <Pictogram {...props}>
      <path d="M14 28h20a7 7 0 0 0 0-14 10 10 0 0 0-19-1 7.5 7.5 0 0 0-1 15Z" />
      <path d="M16 34l-2 6M24 34l-2 6M32 34l-2 6" />
    </Pictogram>
  );
}
