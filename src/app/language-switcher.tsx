"use client";

import { LOCALE_COOKIE, type Locale } from "@/lib/i18n/locale";
import { useRouter } from "next/navigation";

export function LanguageSwitcher({ locale }: { locale: Locale }) {
  const router = useRouter();
  const nextLocale = locale === "en" ? "ar" : "en";

  function switchLanguage(): void {
    document.cookie = `${LOCALE_COOKIE}=${nextLocale}; Path=/; Max-Age=31536000; SameSite=Lax`;
    router.refresh();
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
