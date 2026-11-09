"use client";

import { ArrowLeft } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { t } from "@/lib/i18n";

type WizardProps = {
  /** Étape courante, à partir de 1. */
  step: number;
  total: number;
  /** Une seule question par écran. */
  question: string;
  hint?: string;
  onBack?: () => void;
  /** Action principale, en bas de l'écran, accessible au pouce. */
  footer?: ReactNode;
  children: ReactNode;
};

/** Assistant pas à pas : barre de progression, bouton Retour toujours visible. */
export function Wizard({ step, total, question, hint, onBack, footer, children }: WizardProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  // À chaque étape, le focus va sur la question (lecteurs d'écran).
  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-4">
      <div className="sticky top-0 z-10 flex items-center gap-3 bg-base-100 py-3">
        <button
          type="button"
          onClick={onBack}
          disabled={!onBack}
          className="btn btn-ghost min-h-12 h-12 gap-2 rounded-full px-3 text-base"
        >
          <ArrowLeft aria-hidden="true" size={24} strokeWidth={2.5} />
          {t.common.back}
        </button>
        <div className="flex-1">
          <progress
            className="progress progress-primary h-3 w-full"
            value={step}
            max={total}
            aria-label={t.common.step(step, total)}
          />
          <p className="text-sm">{t.common.step(step, total)}</p>
        </div>
      </div>

      <div key={step} className="page-in flex flex-1 flex-col">
        <h1 ref={headingRef} tabIndex={-1} className="mt-4 text-2xl font-bold outline-none">
          {question}
        </h1>
        {hint ? <p className="mt-2 text-base opacity-80">{hint}</p> : null}

        <div className="mt-6 flex-1">{children}</div>
      </div>

      {footer ? (
        <div className="sticky bottom-0 bg-base-100 py-4">{footer}</div>
      ) : null}
    </div>
  );
}

type ChoiceCardProps = {
  selected: boolean;
  onSelect: () => void;
  icon?: ReactNode;
  label: string;
  description?: string;
};

/** Carte à pictogramme pour répondre sans clavier. */
export function ChoiceCard({ selected, onSelect, icon, label, description }: ChoiceCardProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`press flex min-h-20 w-full items-center gap-4 rounded-box border-2 p-4 text-left ${
        selected
          ? "border-primary bg-primary/10"
          : "border-base-300 bg-base-100 hover:border-primary/60"
      }`}
    >
      {icon ? <span className="shrink-0 text-primary">{icon}</span> : null}
      <span className="flex flex-col">
        <span className="text-lg font-bold">{label}</span>
        {description ? <span className="text-base opacity-80">{description}</span> : null}
      </span>
    </button>
  );
}
