"use client";

import { CloudSun, House, Map, MessagesSquare, Sprout } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { t } from "@/lib/i18n";

const tabs = [
  { href: "/accueil", label: t.nav.home, Icon: House },
  { href: "/conseil", label: t.nav.advice, Icon: Sprout },
  { href: "/meteo", label: t.nav.weather, Icon: CloudSun },
  { href: "/region", label: t.nav.region, Icon: Map },
  { href: "/echanges", label: t.nav.exchanges, Icon: MessagesSquare },
] as const;

/** Barre du bas, onglet actif lu dans l'URL. */
export function BottomNav() {
  return <BottomNavView pathname={usePathname()} />;
}

/** Barre du bas : 5 onglets, icône + libellé, onglet actif très visible. */
export function BottomNavView({ pathname }: { pathname: string }) {
  return (
    <nav
      aria-label={t.nav.label}
      className="fixed inset-x-0 bottom-0 z-20 border-t border-base-300 bg-base-100 pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto grid max-w-xl grid-cols-5">
        {tabs.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-16 flex-col items-center justify-center gap-0.5 px-1 text-center text-xs leading-tight font-bold ${
                  active ? "text-primary" : "text-base-content/75"
                }`}
              >
                <span
                  className={`flex h-8 w-14 items-center justify-center rounded-full transition-colors duration-150 ${
                    active ? "bg-primary text-primary-content" : ""
                  }`}
                >
                  <Icon aria-hidden="true" size={24} strokeWidth={active ? 2.75 : 2} />
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
