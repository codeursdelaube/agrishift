"use client";

import { ArrowRight, Check, LocateFixed, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { priorityIcons } from "@/components/icons";
import { TogoMap } from "@/components/illustrations/TogoMap";
import { Button } from "@/components/ui/Button";
import { CropPhoto } from "@/components/ui/Photo";
import { ChoiceCard, Wizard } from "@/components/wizard/Wizard";
import { db, setMeta, type ProfileRow } from "@/lib/db";
import { t } from "@/lib/i18n";
import { setOnboarded } from "@/lib/onboarding";
import { preparePacks } from "@/lib/packs";
import { syncNow } from "@/lib/sync";
import type { Priority } from "@/lib/types";
import { nearestZone, ZONES } from "@/lib/zones";

const O = t.onboarding;
const TOTAL = 4;
const PRIORITIES: Priority[] = ["food_security", "drought_resilience", "balanced"];

type LocateState = "idle" | "locating" | "failed";

export function OnboardingWizard({ initial }: { initial: ProfileRow | null }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [zoneId, setZoneId] = useState<string | null>(initial?.zone_id ?? null);
  const [name, setName] = useState(initial?.display_name ?? "");
  const [priority, setPriority] = useState<Priority | null>(initial?.priority ?? null);
  const [locate, setLocate] = useState<LocateState>("idle");
  const [saved, setSaved] = useState(false);
  const [progress, setProgress] = useState(0);

  const back = step > 1 ? () => setStep(step - 1) : () => router.push("/");

  function locateMe() {
    if (!("geolocation" in navigator)) {
      setLocate("failed");
      return;
    }
    setLocate("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setZoneId(nearestZone(pos.coords.latitude, pos.coords.longitude).zone_id);
        setLocate("idle");
      },
      () => setLocate("failed"),
      { timeout: 10000, maximumAge: 600000 },
    );
  }

  async function finish(p: Priority) {
    if (!zoneId) return;
    setPriority(p);
    setStep(4);
    const trimmed = name.trim();
    await db.profile.put({
      id: "me",
      zone_id: zoneId,
      priority: p,
      ...(trimmed ? { display_name: trimmed } : {}),
    });
    // Après un changement de zone, il faut relire l'historique de la nouvelle zone (§3.3).
    if (initial && initial.zone_id !== zoneId) await db.meta.delete("apiCursor");
    await setMeta("profileDirty", true);
    await setMeta("onboarded", true);
    setOnboarded(true);
    // Évite que le navigateur efface les données hors ligne (§10).
    try {
      await navigator.storage?.persist?.();
    } catch {
      // Non supporté : sans conséquence.
    }
    await preparePacks(zoneId, setProgress);
    void syncNow();
    setSaved(true);
  }

  if (step === 1) {
    return (
      <Wizard
        step={1}
        total={TOTAL}
        question={O.regionQ}
        hint={O.regionHint}
        onBack={back}
        footer={
          <Button
            block
            size="lg"
            disabled={!zoneId}
            onClick={() => setStep(2)}
            icon={<ArrowRight size={24} />}
          >
            {t.common.next}
          </Button>
        }
      >
        <Button
          variant="outline"
          block
          onClick={locateMe}
          disabled={locate === "locating"}
          icon={<LocateFixed size={22} />}
        >
          {locate === "locating" ? O.locating : O.locate}
        </Button>
        {locate === "failed" ? (
          <p role="alert" className="mt-2 font-bold text-error">
            {O.locateFailed}
          </p>
        ) : null}
        <div role="radiogroup" aria-label={O.regionQ} className="mt-4 flex flex-col gap-3">
          {ZONES.map((z) => (
            <ChoiceCard
              key={z.zone_id}
              selected={zoneId === z.zone_id}
              onSelect={() => setZoneId(z.zone_id)}
              icon={<TogoMap highlight={z.map} title={z.name_fr} className="h-20 w-auto text-base-content" />}
              label={z.name_fr}
              description={z.town_fr === z.name_fr ? undefined : z.town_fr}
            />
          ))}
        </div>
      </Wizard>
    );
  }

  if (step === 2) {
    return (
      <Wizard
        step={2}
        total={TOTAL}
        question={O.nameQ}
        hint={O.nameHintPublic}
        onBack={back}
        footer={
          <div className="flex flex-col gap-2">
            <Button block size="lg" onClick={() => setStep(3)} icon={<ArrowRight size={24} />}>
              {t.common.next}
            </Button>
            <Button
              block
              variant="ghost"
              onClick={() => {
                setName("");
                setStep(3);
              }}
            >
              {t.common.skip}
            </Button>
          </div>
        }
      >
        <label className="flex flex-col gap-2">
          <span className="text-lg font-bold">{O.nameLabel}</span>
          <input
            type="text"
            autoComplete="given-name"
            maxLength={40}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input input-lg w-full text-lg"
          />
        </label>
      </Wizard>
    );
  }

  if (step === 3) {
    return (
      <Wizard step={3} total={TOTAL} question={O.priorityQ} onBack={back}>
        <div role="radiogroup" aria-label={O.priorityQ} className="flex flex-col gap-3">
          {PRIORITIES.map((p) => {
            const Icon = priorityIcons[p];
            return (
              <ChoiceCard
                key={p}
                selected={priority === p}
                onSelect={() => void finish(p)}
                icon={<Icon size={48} />}
                label={t.priorities[p]}
                description={O.priorityDesc[p]}
              />
            );
          })}
        </div>
      </Wizard>
    );
  }

  return (
    <Wizard
      step={4}
      total={TOTAL}
      question={saved ? O.readyDone : O.readyQ}
      onBack={back}
      footer={
        saved ? (
          <Button block size="lg" href="/parcelles/nouvelle" icon={<Plus size={24} />}>
            {O.addFirstField}
          </Button>
        ) : null
      }
    >
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        {saved ? (
          <span className="flex h-24 w-24 items-center justify-center rounded-full bg-success text-success-content">
            <Check aria-hidden="true" size={56} strokeWidth={3} />
          </span>
        ) : (
          <progress className="progress progress-primary h-4 w-full" aria-label={O.readyQ} value={progress} max={1} />
        )}
        {saved ? <p className="text-lg">{O.readyText}</p> : null}
        <div aria-hidden="true" className="flex gap-2">
          {["maize", "sorghum", "rice", "groundnut", "cowpea"].map((c) => (
            <CropPhoto key={c} cropId={c} size={52} />
          ))}
        </div>
      </div>
    </Wizard>
  );
}
