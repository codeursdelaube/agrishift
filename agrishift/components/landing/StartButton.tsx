"use client";

import { ArrowRight } from "lucide-react";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/Button";
import { t } from "@/lib/i18n";
import { isOnboarded } from "@/lib/onboarding";

const subscribe = () => () => {};

/** « Commencer » → /demarrer, ou /accueil si l'app est déjà configurée. */
export function StartButton() {
  const onboarded = useSyncExternalStore(subscribe, isOnboarded, () => false);

  return (
    <Button
      href={onboarded ? "/accueil" : "/demarrer"}
      size="lg"
      block
      icon={<ArrowRight size={26} strokeWidth={2.75} />}
      className="sm:w-auto"
    >
      {onboarded ? t.landing.continue : t.landing.start}
    </Button>
  );
}
