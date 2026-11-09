"use client";

import { Download, Share } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/Button";
import { t } from "@/lib/i18n";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const subscribe = () => () => {};

function isIosBrowser(): boolean {
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return ios && !standalone;
}

/** « Installer l'application » (Android/Chrome), ou petite aide sur iPhone. */
export function InstallButton() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const ios = useSyncExternalStore(subscribe, isIosBrowser, () => false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) {
    return <p className="font-bold" role="status">{t.landing.installDone}</p>;
  }

  if (promptEvent) {
    return (
      <Button
        variant="outline"
        size="lg"
        block
        className="sm:w-auto bg-base-100/90"
        icon={<Download size={24} strokeWidth={2.5} />}
        onClick={async () => {
          await promptEvent.prompt();
          await promptEvent.userChoice;
          setPromptEvent(null);
        }}
      >
        {t.landing.install}
      </Button>
    );
  }

  if (ios) {
    return (
      <p className="flex items-start gap-2 rounded-box bg-base-100/90 p-3 text-base text-base-content">
        <Share aria-hidden="true" className="mt-0.5 shrink-0" size={22} />
        {t.landing.installIosHelp}
      </p>
    );
  }

  return null;
}
