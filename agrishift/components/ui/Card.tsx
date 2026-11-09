import type { HTMLAttributes, ReactNode } from "react";

type CardProps = HTMLAttributes<HTMLElement> & {
  as?: "div" | "section" | "article" | "li";
  children: ReactNode;
};

/** Carte arrondie, ombre douce, beaucoup d'espace. */
export function Card({ as: Tag = "div", className = "", children, ...rest }: CardProps) {
  return (
    <Tag
      className={`card bg-base-100 border border-base-300 shadow-sm ${className}`}
      {...rest}
    >
      <div className="card-body gap-3 p-5">{children}</div>
    </Tag>
  );
}
