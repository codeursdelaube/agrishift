import { Suspense } from "react";
import { Skeleton } from "@/components/ui/ComingSoon";
import DetailClient from "./DetailClient";

export default function RotationDetailPage() {
  return (
    <Suspense fallback={<Skeleton lines={4} />}>
      <DetailClient />
    </Suspense>
  );
}
