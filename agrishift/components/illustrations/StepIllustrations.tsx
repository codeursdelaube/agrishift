import { Pictogram } from "@/components/icons";

/** Étape 2 : un champ vu de dessus, avec ses rangs. */
export function FieldPlotIllustration({ size = 72 }: { size?: number }) {
  return (
    <Pictogram size={size}>
      <path d="M6 14l18-8 18 8-18 8Z" fill="var(--color-secondary)" fillOpacity="0.15" />
      <path d="M6 14v20l18 8 18-8V14" />
      <path d="M24 22v20" />
      <path d="M11 18l18-8M16 20l18-8M20 21l16-7" strokeWidth={2} />
    </Pictogram>
  );
}

/** Étape 3 : un téléphone montrant 3 propositions classées. */
export function PhoneAdviceIllustration({ size = 72 }: { size?: number }) {
  return (
    <Pictogram size={size}>
      <rect x="12" y="4" width="24" height="40" rx="4" />
      <path d="M21 8h6" strokeWidth={2} />
      <path d="M17 16h3M17 24h3M17 32h3" stroke="var(--color-primary)" strokeWidth={4} />
      <path d="M23 16h8M23 24h8M23 32h6" strokeWidth={2.5} />
    </Pictogram>
  );
}
