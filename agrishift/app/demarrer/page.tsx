"use client";

import { Skeleton } from "@/components/ui/ComingSoon";
import { useProfile } from "@/lib/hooks";
import { OnboardingWizard } from "./OnboardingWizard";

/** Onboarding : 1 question par écran (§9.3). Pré-rempli si un profil existe déjà. */
export default function StartPage() {
  const profile = useProfile();

  if (profile === undefined) {
    return (
      <div className="mx-auto max-w-xl p-4">
        <Skeleton lines={4} />
      </div>
    );
  }
  return <OnboardingWizard initial={profile} />;
}
