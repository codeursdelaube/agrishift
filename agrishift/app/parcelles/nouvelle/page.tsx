"use client";

import { MapPin } from "lucide-react";
import { PlotWizard } from "@/components/plots/PlotWizard";
import { Button } from "@/components/ui/Button";
import { ComingSoon, Skeleton } from "@/components/ui/ComingSoon";
import { usePlots, useProfile } from "@/lib/hooks";
import { t } from "@/lib/i18n";

/** Ajouter un champ (plein écran, sans barre de navigation : un seul objectif). */
export default function NewPlotPage() {
  const profile = useProfile();
  const plots = usePlots();

  if (profile === undefined || plots === undefined) {
    return (
      <div className="mx-auto max-w-xl p-4">
        <Skeleton lines={4} />
      </div>
    );
  }

  if (profile === null) {
    return (
      <div className="mx-auto max-w-xl p-4">
        <ComingSoon icon={<MapPin size={64} aria-hidden="true" />} title={t.home.notSetUp} text="">
          <Button href="/demarrer" size="lg">
            {t.landing.start}
          </Button>
        </ComingSoon>
      </div>
    );
  }

  return <PlotWizard zoneId={profile.zone_id} existingCount={plots.length} />;
}
