import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "outline" | "ghost";
type Size = "md" | "lg";

const variantClass: Record<Variant, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  outline: "btn-outline",
  ghost: "btn-ghost",
};

const sizeClass: Record<Size, string> = {
  // Cibles tactiles ≥ 48 px dans tous les cas.
  md: "min-h-12 h-auto px-5 text-base",
  lg: "min-h-14 h-auto px-6 text-lg",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  icon?: ReactNode;
  className?: string;
  children: ReactNode;
};

type AsButton = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & {
    href?: undefined;
  };

type AsLink = CommonProps & { href: string; prefetch?: boolean };

export type ButtonProps = AsButton | AsLink;

/** Gros bouton lisible : icône + texte, jamais l'icône seule. */
export function Button(props: ButtonProps) {
  const {
    variant = "primary",
    size = "md",
    block = false,
    icon,
    className = "",
    children,
  } = props;
  const classes = [
    "btn rounded-full font-bold gap-3 py-2",
    variantClass[variant],
    sizeClass[size],
    block ? "btn-block" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      {icon ? <span aria-hidden="true" className="shrink-0">{icon}</span> : null}
      <span>{children}</span>
    </>
  );

  if (props.href !== undefined) {
    return (
      <Link href={props.href} prefetch={props.prefetch} className={classes}>
        {content}
      </Link>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { variant: _v, size: _s, block: _b, icon: _i, className: _c, children: _ch, ...rest } =
    props;
  return (
    <button type="button" {...rest} className={classes}>
      {content}
    </button>
  );
}
