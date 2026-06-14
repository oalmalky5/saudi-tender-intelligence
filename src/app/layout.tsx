import type { Metadata } from "next";
import { localeDirection } from "@/lib/i18n/locale";
import { getLocale } from "@/lib/i18n/locale-server";
import { AppShell } from "./app-shell";
import { getSession } from "@/lib/auth/session";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tender Intelligence",
  description: "Discover relevant Saudi government tenders.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const session = await getSession();

  return (
    <html lang={locale} dir={localeDirection(locale)} className="h-full" data-scroll-behavior="smooth">
      <body className="min-h-full">
        <AppShell locale={locale} authenticated={session !== null}>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
