"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { FieldPlotIllustration } from "@/components/illustrations/StepIllustrations";
import { PlotCard } from "@/components/plots/PlotCard";
import { Button } from "@/components/ui/Button";
import { ComingSoon, Skeleton } from "@/components/ui/ComingSoon";
import { usePlots } from "@/lib/hooks";
import { t } from "@/lib/i18n";

/** Que planter ? — choisir le champ. Avec un seul champ, on y va directement (§9.6). */
export default function AdvicePickerPage() {
  const plots = usePlots();
  const router = useRouter();
  const only = plots?.length === 1 ? plots[0].id : null;

  useEffect(() => {
    if (only) router.replace(`/conseil/${only}`);
  }, [only, router]);

  if (plots === undefined || only) return <Skeleton lines={3} />;

  if (plots.length === 0) {
    return (
      <ComingSoon icon={<FieldPlotIllustration size={80} />} title={t.advice.needField}>
        <Button href="/parcelles/nouvelle" size="lg" icon={<Plus size={24} />}>
          {t.home.addField}
        </Button>
      </ComingSoon>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold">{t.advice.chooseField}</h1>
      <ul className="flex flex-col gap-3">
        {plots.map((p) => (
          <li key={p.id}>
            <PlotCard plot={p} href={`/conseil/${p.id}`} />
          </li>
        ))}
      </ul>
    </div>
  );
}
