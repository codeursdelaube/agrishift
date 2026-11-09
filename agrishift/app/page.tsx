import { Database, ShieldCheck, Sprout, Users, WifiOff } from "lucide-react";
import Link from "next/link";
import { DryCloudIcon, MaizeIcon, SunIcon } from "@/components/icons";
import {
  FieldPlotIllustration,
  PhoneAdviceIllustration,
} from "@/components/illustrations/StepIllustrations";
import { TogoMap } from "@/components/illustrations/TogoMap";
import { InstallButton } from "@/components/landing/InstallButton";
import { StartButton } from "@/components/landing/StartButton";
import { Photo } from "@/components/ui/Photo";
import { t } from "@/lib/i18n";

const L = t.landing;

const benefitIcons = [
  <MaizeIcon key="maize" size={48} />,
  <DryCloudIcon key="dry" size={48} />,
  <WifiOff key="offline" size={44} strokeWidth={2.5} aria-hidden="true" />,
];

const stepIllustrations = [
  <TogoMap key="map" title={L.steps[0].text} className="h-20 w-auto" />,
  <FieldPlotIllustration key="plot" size={72} />,
  <PhoneAdviceIllustration key="phone" size={72} />,
];

const forWhoIcons = [Sprout, Users, ShieldCheck];
const CROPS = ["maize", "sorghum", "rice", "groundnut", "cowpea"] as const;

export default function LandingPage() {
  return (
    <>
      <main>
        {/* 1. Hero */}
        <section className="relative isolate flex min-h-[88dvh] items-end overflow-hidden">
          <Photo image="hero" sizes="100vw" priority decorative className="absolute inset-0 -z-20 h-full w-full object-[30%_center]" />
          <span className="sr-only">{L.heroAlt}</span>
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-linear-to-t from-black/85 via-black/45 to-black/10"
          />
          <div className="page-in mx-auto w-full max-w-5xl px-4 pb-10 pt-24 text-white">
            <p className="absolute top-4 left-4 inline-flex items-center gap-2 rounded-full bg-black/50 px-3 py-1 text-base font-bold">
              <SunIcon size={22} />
              {t.app.name}
            </p>
            <h1 className="max-w-2xl text-3xl font-bold sm:text-5xl">{L.title}</h1>
            <p className="mt-3 max-w-xl text-lg sm:text-xl">{L.subtitle}</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <StartButton />
              <InstallButton />
            </div>
          </div>
        </section>

        {/* 2. Trois bénéfices */}
        <section aria-labelledby="benefits-title" className="mx-auto max-w-5xl px-4 py-12">
          <h2 id="benefits-title" className="text-2xl font-bold sm:text-3xl">
            {L.benefitsTitle}
          </h2>
          <ul className="mt-6 grid gap-4 md:grid-cols-3">
            {L.benefits.map((b, i) => (
              <li
                key={b.title}
                className="flex items-start gap-4 rounded-box border border-base-300 bg-base-100 p-5 shadow-sm"
              >
                <span className="shrink-0 rounded-full bg-primary/10 p-2 text-primary">
                  {benefitIcons[i]}
                </span>
                <div>
                  <h3 className="text-xl font-bold">{b.title}</h3>
                  <p className="mt-1">{b.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Les cinq cultures */}
        <section aria-labelledby="crops-title" className="mx-auto max-w-5xl px-4 pb-12">
          <h2 id="crops-title" className="text-2xl font-bold sm:text-3xl">
            {L.cropsTitle}
          </h2>
          <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {CROPS.map((crop) => (
              <li key={crop} className="relative isolate overflow-hidden rounded-box">
                <Photo
                  image={crop}
                  sizes="(max-width: 640px) 50vw, 20vw"
                  decorative
                  className="aspect-square h-auto w-full"
                />
                <span className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 to-transparent px-3 pt-8 pb-2 text-lg font-bold text-white">
                  {t.crops[crop]}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* 3. Comment ça marche */}
        <section aria-labelledby="how-title" className="bg-base-200">
          <div className="mx-auto max-w-5xl px-4 py-12">
            <h2 id="how-title" className="text-2xl font-bold sm:text-3xl">
              {L.howTitle}
            </h2>
            <ol className="mt-6 grid gap-4 md:grid-cols-3">
              {L.steps.map((s, i) => (
                <li
                  key={s.title}
                  className="flex items-center gap-4 rounded-box bg-base-100 p-5 shadow-sm md:flex-col md:items-start"
                >
                  <span className="flex h-20 w-20 shrink-0 items-center justify-center text-secondary">
                    {stepIllustrations[i]}
                  </span>
                  <div>
                    <p className="text-sm font-bold uppercase tracking-wide text-secondary">
                      {L.stepLabel(i + 1)}
                    </p>
                    <h3 className="text-xl font-bold">{s.title}</h3>
                    <p className="mt-1">{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* 4. Données */}
        <section aria-labelledby="data-title" className="mx-auto max-w-5xl px-4 py-12">
          <div className="flex flex-col gap-4 rounded-box bg-accent p-6 text-accent-content md:flex-row md:items-center">
            <Database aria-hidden="true" size={48} strokeWidth={2} className="shrink-0" />
            <div>
              <h2 id="data-title" className="text-2xl font-bold">
                {L.dataTitle}
              </h2>
              <p className="mt-2 text-lg">{L.dataText}</p>
              <p className="mt-2 font-bold">{L.dataHonest}</p>
            </div>
          </div>
        </section>

        {/* 5. Pour qui */}
        <section aria-labelledby="who-title" className="mx-auto max-w-5xl px-4 pb-12">
          <h2 id="who-title" className="text-2xl font-bold sm:text-3xl">
            {L.forWhoTitle}
          </h2>
          <Photo
            image="community"
            sizes="(max-width: 1024px) 100vw, 960px"
            className="mt-6 aspect-[16/9] h-auto w-full rounded-box"
          />
          <ul className="mt-4 grid gap-4 md:grid-cols-3">
            {L.forWho.map((w, i) => {
              const Icon = forWhoIcons[i];
              return (
                <li key={w.title} className="flex items-start gap-4 rounded-box bg-base-200 p-5">
                  <Icon aria-hidden="true" size={36} className="shrink-0 text-primary" />
                  <div>
                    <h3 className="text-xl font-bold">{w.title}</h3>
                    <p className="mt-1">{w.text}</p>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="mt-8 flex justify-center">
            <StartButton />
          </div>
        </section>
      </main>

      {/* 6. Pied de page — pas de logo NASA. */}
      <footer className="bg-neutral text-neutral-content">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-8">
          <nav aria-label={t.footer.about} className="flex flex-wrap gap-x-6 gap-y-2">
            <Link href="/a-propos" className="link inline-flex min-h-12 items-center font-bold">
              {t.footer.about}
            </Link>
            <Link href="/a-propos#credits" className="link inline-flex min-h-12 items-center font-bold">
              {t.footer.credits}
            </Link>
          </nav>
          <p>{t.footer.project}</p>
          <p className="text-sm opacity-80">{t.footer.notNasa}</p>
        </div>
      </footer>
    </>
  );
}
