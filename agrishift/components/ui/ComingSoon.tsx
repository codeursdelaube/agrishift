import type { ReactNode } from "react";

/** État « bientôt disponible » : illustration + phrase simple, jamais d'écran blanc. */
export function ComingSoon({
  icon,
  title,
  text,
  children,
}: {
  icon: ReactNode;
  title: string;
  text?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-box bg-base-200 px-5 py-10 text-center">
      <span className="text-secondary">{icon}</span>
      <h2 className="text-xl font-bold">{title}</h2>
      {text ? <p className="max-w-sm">{text}</p> : null}
      {children}
    </div>
  );
}

/** Squelette de chargement (pas de spinner seul). */
export function Skeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="flex flex-col gap-3" aria-hidden="true">
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} className="skeleton h-20 w-full" />
      ))}
    </div>
  );
}
