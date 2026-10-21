import type { Metadata, Viewport } from "next";
import "@/styles/globals.css";
import { I18nProvider } from "@/lib/i18n";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Monsieur Fanyi — Soutien Scolaire d'Excellence en Guinée",
  description:
    "Plateforme de mise en relation de confiance entre parents et professeurs particuliers en Guinée. Suivi pédagogique transparent, cours vérifiés et paiements sécurisés.",
  keywords: [
    "soutien scolaire",
    "cours particuliers",
    "professeur Guinée",
    "Conakry",
    "Monsieur Fanyi",
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
    <html lang="fr" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-brand-blue selection:text-white">
        <I18nProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </I18nProvider>
      </body>
    </html>
  );
}
