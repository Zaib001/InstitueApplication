import type { Metadata, Viewport } from "next";
import { Playfair_Display, Plus_Jakarta_Sans, DM_Sans } from "next/font/google";
import "@/styles/globals.css";
import { I18nProvider } from "@/lib/i18n";
import { PublicLayoutShell } from "@/components/layout/PublicLayoutShell";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["600", "700", "800", "900"],
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Monsieur Fanyi — Soutien Scolaire d'Excellence en Guinée",
  description:
    "Plateforme de référence pour les cours particuliers et le tutorat scolaire à Conakry et en Guinée. Enseignants qualifiés, suivi personnalisé des séances et paiements sécurisés.",
  keywords: [
    "soutien scolaire Guinée",
    "cours particuliers Conakry",
    "professeur particulier",
    "Monsieur Fanyi",
    "cours de maths Conakry",
    "Orange Money",
    "MTN Mobile Money",
  ],
  authors: [{ name: "Monsieur Fanyi Éducation" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${playfair.variable} ${plusJakarta.variable} ${dmSans.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen flex flex-col bg-brand-surface text-brand-charcoal antialiased selection:bg-[#e59a38] selection:text-white">
        <I18nProvider>
          <PublicLayoutShell>{children}</PublicLayoutShell>
        </I18nProvider>
      </body>
    </html>
  );
}
