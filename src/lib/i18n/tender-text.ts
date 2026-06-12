import type { Locale } from "./locale";

export type LocalizedTenderText = {
  value: string | null;
  language: "en" | "ar";
  direction: "ltr" | "rtl";
};

export function localizedTenderText(
  locale: Locale,
  english: string | null,
  arabic: string | null,
): LocalizedTenderText {
  if (locale === "en" && english) {
    return { value: english, language: "en", direction: "ltr" };
  }

  return { value: arabic, language: "ar", direction: "rtl" };
}
