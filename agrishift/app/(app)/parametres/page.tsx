"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { Info, Moon, RefreshCw, Sun, Trash2, Volume2, VolumeX } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { db } from "@/lib/db";
import { relativeFr } from "@/lib/format";
import { useOnline, usePendingCount, useProfile, useRejected } from "@/lib/hooks";
import { t } from "@/lib/i18n";
import { setOnboarded } from "@/lib/onboarding";
import {
  resetPrefs,
  setTextScale,
  setTheme,
  setVoiceOn,
  useTextScale,
  useTheme,
  useVoiceOn,
  type TextScale,
} from "@/lib/prefs";
import { syncNow, useSyncStatus } from "@/lib/sync";
import { getZone } from "@/lib/zones";

const S = t.settings;

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-box border border-base-300 p-4">
      <h2 className="text-xl font-bold">{title}</h2>
      {children}
    </section>
  );
}

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: ReactNode; aria?: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="grid grid-flow-col auto-cols-fr gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          aria-label={o.aria}
          onClick={() => onChange(o.value)}
          className={`btn min-h-14 h-auto rounded-full font-bold ${
            value === o.value ? "btn-primary" : "btn-outline"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Paramètres (§9.11). */
export default function SettingsPage() {
  const router = useRouter();
  const textScale = useTextScale();
  const theme = useTheme();
  const voiceOn = useVoiceOn();
  const profile = useProfile();
  const pending = usePendingCount();
  const rejected = useRejected();
  const online = useOnline();
  const syncStatus = useSyncStatus();
  const packs = useLiveQuery(() => db.packs.toArray(), []);
  const [confirmStep, setConfirmStep] = useState<0 | 1 | 2>(0);

  async function clearAll() {
    setConfirmStep(0);
    await db.delete();
    await db.open();
    setOnboarded(false);
    resetPrefs();
    router.push("/");
  }

  const zone = getZone(profile?.zone_id);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold">{S.title}</h1>

      <Section title={S.textSize}>
        <Segmented<TextScale>
          label={S.textSize}
          value={textScale}
          onChange={setTextScale}
          options={[
            { value: "md", label: <span className="text-base">A</span>, aria: "A" },
            { value: "lg", label: <span className="text-lg">A+</span>, aria: "A+" },
            { value: "xl", label: <span className="text-xl">A++</span>, aria: "A++" },
          ]}
        />
        <p>{S.textSizeDemo}</p>
      </Section>

      <Section title={S.voice}>
        <Segmented<"on" | "off">
          label={S.voice}
          value={voiceOn ? "on" : "off"}
          onChange={(v) => setVoiceOn(v === "on")}
          options={[
            { value: "on", label: <><Volume2 aria-hidden="true" size={22} /> {S.on}</> },
            { value: "off", label: <><VolumeX aria-hidden="true" size={22} /> {S.off}</> },
          ]}
        />
        <p className="text-base opacity-80">{S.voiceHint}</p>
      </Section>

      <Section title={S.theme}>
        <Segmented
          label={S.theme}
          value={theme}
          onChange={setTheme}
          options={[
            { value: "agrishift", label: <><Sun aria-hidden="true" size={22} /> {S.light}</> },
            { value: "agrishift-dark", label: <><Moon aria-hidden="true" size={22} /> {S.dark}</> },
          ]}
        />
      </Section>

      <Section title={S.profile}>
        {profile ? (
          <p className="text-lg">
            <strong>{zone?.name_fr ?? profile.zone_id}</strong> · {t.priorities[profile.priority]}
          </p>
        ) : null}
        <Button href="/demarrer" variant="outline" block>
          {S.change}
        </Button>
      </Section>

      <Section title={S.sync}>
        <p>{S.pendingItems(pending)}</p>
        {syncStatus.lastAt ? <p className="text-base opacity-80">{t.sync.lastAt(relativeFr(syncStatus.lastAt))}</p> : null}
        {syncStatus.phase === "error" ? <p role="alert" className="font-bold text-error">{t.sync.error}</p> : null}
        {!online ? <p className="font-bold">{t.sync.offline}</p> : null}
        {rejected.length > 0 ? <p className="font-bold text-error">{t.sync.rejectedCount(rejected.length)}</p> : null}
        <Button
          variant="outline"
          block
          disabled={!online || syncStatus.phase === "sending"}
          icon={<RefreshCw size={22} />}
          onClick={() => void syncNow()}
        >
          {syncStatus.phase === "sending" ? t.sync.sending : t.sync.now}
        </Button>
      </Section>

      <Section title={S.offlineData}>
        {packs && packs.length > 0 ? (
          <ul className="list-disc pl-6">
            {packs.map((p) => (
              <li key={p.zone_id}>
                {S.packLine(getZone(p.zone_id)?.name_fr ?? p.zone_id, p.pack_version, relativeFr(p.fetched_at))}
              </li>
            ))}
          </ul>
        ) : (
          <p>{S.noPacks}</p>
        )}
      </Section>

      <Button href="/a-propos" variant="ghost" block icon={<Info size={22} />}>
        {t.footer.about}
      </Button>

      <Button
        variant="ghost"
        block
        className="text-error"
        icon={<Trash2 size={22} />}
        onClick={() => setConfirmStep(1)}
      >
        {S.clearData}
      </Button>

      <ConfirmDialog
        open={confirmStep === 1}
        message={S.clearConfirm1}
        confirmLabel={S.clearData}
        onCancel={() => setConfirmStep(0)}
        onConfirm={() => setConfirmStep(2)}
      />
      <ConfirmDialog
        open={confirmStep === 2}
        message={S.clearConfirm2}
        confirmLabel={S.clearData}
        onCancel={() => setConfirmStep(0)}
        onConfirm={() => void clearAll()}
      />
    </div>
  );
}
