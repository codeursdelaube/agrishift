"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useParams } from "next/navigation";
import { FallowIcon } from "@/components/icons";
import { PlotWizard } from "@/components/plots/PlotWizard";
import { Button } from "@/components/ui/Button";
import { ComingSoon, Skeleton } from "@/components/ui/ComingSoon";
import { db } from "@/lib/db";
import { t } from "@/lib/i18n";

/** Modifier un champ : même assistant, pré-rempli. */
export default function EditPlotPage() {
  const { id } = useParams<{ id: string }>();
  const plot = useLiveQuery(async () => (await db.plots.get(id)) ?? null, [id]);

  if (plot === undefined) {
    return (
      <div className="mx-auto max-w-xl p-4">
        <Skeleton lines={4} />
      </div>
    );
  }

  if (plot === null || plot.deleted) {
    return (
      <div className="mx-auto max-w-xl p-4">
        <ComingSoon icon={<FallowIcon size={72} />} title={t.plot.notFound} text="">
          <Button href="/accueil">{t.common.backHome}</Button>
        </ComingSoon>
      </div>
    );
  }

  return <PlotWizard zoneId={plot.zone_id} initial={plot} existingCount={0} />;
}
