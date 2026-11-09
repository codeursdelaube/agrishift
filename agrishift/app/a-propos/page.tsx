import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { t } from "@/lib/i18n";
import { IMAGES } from "@/lib/images";

const A = t.about;

export const metadata: Metadata = { title: A.title };

function Section({ id, title, items }: { id?: string; title: string; items: readonly string[] }) {
  return (
    <section id={id} aria-labelledby={`${id ?? title}-h`} className="mt-8">
      <h2 id={`${id ?? title}-h`} className="text-2xl font-bold">
        {title}
      </h2>
      <ul className="mt-3 list-disc space-y-2 pl-6">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <Button href="/" variant="ghost" icon={<ArrowLeft size={22} />}>
        {t.common.back}
      </Button>
      <h1 className="mt-4 text-3xl font-bold">{A.title}</h1>

      <Section title={A.methodTitle} items={A.method} />
      <Section title={A.sourcesTitle} items={A.sources} />
      <Section title={A.limitsTitle} items={A.limits} />
      <section id="credits" aria-labelledby="credits-h" className="mt-8">
        <h2 id="credits-h" className="text-2xl font-bold">
          {A.creditsTitle}
        </h2>
        <p className="mt-3">{A.creditsText}</p>
        <ul className="mt-3 list-disc space-y-2 pl-6 text-base">
          {Object.values(IMAGES).map((img) => (
            <li key={img.src}>
              <a href={img.source} className="link" rel="noreferrer">
                {img.alt}
              </a>
              {" — "}
              {img.author}, {img.license}
            </li>
          ))}
        </ul>
      </section>
      <Section title={A.prepTitle} items={[A.prepText]} />

      <p className="mt-10 text-sm opacity-80">{t.footer.notNasa}</p>
    </main>
  );
}
