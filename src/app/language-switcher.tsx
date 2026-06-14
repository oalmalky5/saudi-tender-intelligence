"use client";

import { LOCALE_COOKIE, type Locale } from "@/lib/i18n/locale";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function LanguageSwitcher({ locale }: { locale: Locale }) {
  const router = useRouter();
  const nextLocale = locale === "en" ? "ar" : "en";

  useEffect(() => {
    document.documentElement.removeAttribute("data-language-changing");
  }, [locale]);

  function switchLanguage(): void {
    document.documentElement.dataset.languageChanging = "true";
    document.cookie = `${LOCALE_COOKIE}=${nextLocale}; Path=/; Max-Age=31536000; SameSite=Lax`;
    window.setTimeout(() => router.refresh(), 140);
    window.setTimeout(
      () => document.documentElement.removeAttribute("data-language-changing"),
      900,
    );
  }

  return (
    <button
      type="button"
      onClick={switchLanguage}
      className="language-switcher"
      aria-label={locale === "en" ? "Switch to Arabic" : "التبديل إلى الإنجليزية"}
    >
      {locale === "en" ? "العربية" : "English"}
    </button>
  );
}
