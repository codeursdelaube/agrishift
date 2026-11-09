import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { PwaRegister } from "@/components/PwaRegister";
import { t } from "@/lib/i18n";
import "./globals.css";

// Police auto-hébergée (fichiers @fontsource dans le bundle) : disponible hors-ligne,
// et le build ne dépend pas de l'accès à Google Fonts.
const atkinson = localFont({
  src: [
    {
      path: "../node_modules/@fontsource/atkinson-hyperlegible/files/atkinson-hyperlegible-latin-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../node_modules/@fontsource/atkinson-hyperlegible/files/atkinson-hyperlegible-latin-700-normal.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-atkinson",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: t.app.name,
    template: `%s · ${t.app.shortName}`,
  },
  description: t.app.description,
  applicationName: t.app.name,
  appleWebApp: { capable: true, title: t.app.shortName, statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#2f7d32",
  width: "device-width",
  initialScale: 1,
};

/**
 * Applique la taille du texte (A / A+ / A++) et le thème mémorisés
 * avant le premier affichage, pour éviter un saut visuel.
 */
const prefsScript = `try{var s=localStorage.getItem("agrishift.textScale");if(s==="lg"||s==="xl")document.documentElement.dataset.textScale=s;var th=localStorage.getItem("agrishift.theme");if(th==="agrishift-dark")document.documentElement.dataset.theme=th;}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      data-theme="agrishift"
      className={`${atkinson.variable} antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: prefsScript }} />
      </head>
      <body className="min-h-dvh bg-base-100 text-base-content">
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
