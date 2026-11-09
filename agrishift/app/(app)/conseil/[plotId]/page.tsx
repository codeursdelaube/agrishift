import { Suspense } from "react";
import { Skeleton } from "@/components/ui/ComingSoon";
import AdviceClient from "./AdviceClient";

export default function AdvicePage() {
  return (
    <Suspense fallback={<Skeleton lines={3} />}>
      <AdviceClient />
    </Suspense>
  );
}
