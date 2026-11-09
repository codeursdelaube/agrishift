import type { ReactNode, SVGProps } from "react";

export type PictogramProps = Omit<SVGProps<SVGSVGElement>, "children"> & {
  /** Taille en px (lisible dès 40 px). */
  size?: number;
  /** Texte alternatif. Sans titre, l'icône est décorative (aria-hidden). */
  title?: string;
};

/** Base commune : trait épais, coins ronds, couleur héritée du texte. */
export function Pictogram({
  size = 40,
  title,
  children,
  ...rest
}: PictogramProps & { children: ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}
