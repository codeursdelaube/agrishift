import { House } from "lucide-react";
import { FallowIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { t } from "@/lib/i18n";

/** Jamais d'écran blanc : page simple avec un retour à l'accueil. */
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-6 px-4 text-center">
      <span className="text-secondary">
        <FallowIcon size={96} />
      </span>
      <h1 className="text-2xl font-bold">{t.common.comingSoon}</h1>
      <Button href="/" size="lg" icon={<House size={24} />}>
        {t.common.backHome}
      </Button>
    </main>
  );
}
