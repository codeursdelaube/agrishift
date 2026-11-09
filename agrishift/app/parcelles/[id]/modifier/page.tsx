import { Suspense } from "react";
import { Skeleton } from "@/components/ui/ComingSoon";
import EditPlotClient from "./EditPlotClient";

export default function EditPlotPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-xl p-4">
          <Skeleton lines={4} />
        </div>
      }
    >
      <EditPlotClient />
    </Suspense>
  );
}
