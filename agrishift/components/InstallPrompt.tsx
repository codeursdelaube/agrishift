"use client";

import { Download, Share } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { t } from "@/lib/i18n";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<unknown> };

const ASKED_KEY = "agrishift.installAsked";
const L = t.landing;

function alreadyAsked(): boolean {
  try {
    return window.localStorage.getItem(ASKED_KEY) === "1";
  } catch {
    // Sans stockage, on ne saurait pas s'arrêter de demander.
    return true;
  }
}

function rememberAsked() {
  try {
    window.localStorage.setItem(ASKED_KEY, "1");
  } catch {
    // Stockage indisponible : sans conséquence.
  }
}

function isInstalled(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/** Propose d'installer l'application, une seule fois, à la première ouverture du lien. */
export function InstallPrompt() {
  const [mode, setMode] = useState<"android" | "ios" | null>(null);
  const installEvent = useRef<InstallEvent | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const title = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (alreadyAsked() || isInstalled()) return;
    const offer = (next: "android" | "ios") => {
      rememberAsked();
      setMode(next);
    };

    if (/iphone|ipad|ipod/i.test(navigator.userAgent)) {
      const timer = setTimeout(() => offer("ios"), 800);
      return () => clearTimeout(timer);
    }

    const onPrompt = (e: Event) => {
      e.preventDefault();
      installEvent.current = e as InstallEvent;
      offer("android");
    };
    // L'événement a pu arriver avant le chargement de ce composant (script de app/layout.tsx).
    const early = (window as Window & { __installEvent?: Event }).__installEvent;
    if (early) queueMicrotask(() => onPrompt(early));
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  useEffect(() => {
    if (mode && dialog.current && !dialog.current.open) {
      dialog.current.showModal();
      // Le focus va sur le titre : pas d'anneau sur le bouton à l'ouverture.
      title.current?.focus();
    }
  }, [mode]);

  if (!mode) return null;

  const close = () => setMode(null);

  async function install() {
    const event = installEvent.current;
    close();
    if (!event) return;
    await event.prompt();
    await event.userChoice;
  }

  return (
    <dialog ref={dialog} aria-labelledby="install-title" className="modal modal-bottom sm:modal-middle" onClose={close}>
      <div className="modal-box flex flex-col items-center gap-4 text-center">
        <Image src="/icons/icon-192.png" width={80} height={80} alt="" className="rounded-box" />
        <h2 ref={title} id="install-title" tabIndex={-1} className="text-2xl font-bold outline-none">
          {L.installTitle}
        </h2>
        <p className="text-lg">{L.installText}</p>
        {mode === "android" ? (
          <Button block size="lg" icon={<Download size={24} strokeWidth={2.5} />} onClick={() => void install()}>
            {L.install}
          </Button>
        ) : (
          <p className="flex items-start gap-2 rounded-box bg-base-200 p-3 text-left">
            <Share aria-hidden="true" className="mt-0.5 shrink-0" size={22} />
            {L.installIosHelp}
          </p>
        )}
        <Button block variant="ghost" onClick={close}>
          {mode === "android" ? L.installLater : L.installUnderstood}
        </Button>
      </div>
    </dialog>
  );
}
