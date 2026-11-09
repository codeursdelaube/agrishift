import { Suspense } from "react";
import { Skeleton } from "@/components/ui/ComingSoon";
import PlotDetailClient from "./PlotDetailClient";

export default function PlotDetailPage() {
  return (
    <Suspense fallback={<Skeleton lines={4} />}>
      <PlotDetailClient />
    </Suspense>
  );
}
