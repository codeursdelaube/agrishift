import { Suspense } from "react";
import { AppRuntime } from "@/components/AppRuntime";
import { BottomNav, BottomNavView } from "@/components/ui/BottomNav";
import { TopBar } from "@/components/ui/TopBar";

/** Coque de l'application : barre du haut + navigation du bas. */
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-col">
      <TopBar />
      <AppRuntime />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 pt-4 pb-28">{children}</main>
      {/* La barre s'affiche tout de suite ; l'onglet actif apparaît dès que l'URL est connue. */}
      <Suspense fallback={<BottomNavView pathname="" />}>
        <BottomNav />
      </Suspense>
    </div>
  );
}
