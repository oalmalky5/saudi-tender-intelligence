import type { Metadata } from "next";
import { localeDirection } from "@/lib/i18n/locale";
import { getLocale } from "@/lib/i18n/locale-server";
import "./globals.css";

export const metadata: Metadata = {
  title: "Etimad Tender Intelligence",
  description: "Discover relevant Saudi government tenders.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html lang={locale} dir={localeDirection(locale)} className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
