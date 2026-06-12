export const LOCALE_COOKIE = "etimad-locale";

export type Locale = "en" | "ar";

export function parseLocale(value: string | undefined): Locale {
  return value === "ar" ? "ar" : "en";
}

export function localeDirection(locale: Locale): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr";
}

export function dateLocale(locale: Locale): string {
  return locale === "ar" ? "ar-SA" : "en-GB";
}

export function pick(
  locale: Locale,
  english: string,
  arabic: string,
): string {
  return locale === "ar" ? arabic : english;
}
