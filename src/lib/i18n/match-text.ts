import { pick, type Locale } from "./locale";

const replacements: Array<[string, string]> = [
  ["Activity matches:", "تطابق النشاط:"],
  ["Matched terms:", "المصطلحات المطابقة:"],
  ["Target government entity:", "جهة حكومية مستهدفة:"],
  ["Preferred region:", "منطقة مفضلة:"],
  ["Preferred opportunity type:", "نوع فرصة مفضل:"],
  ["Excluded terms found:", "تم العثور على مصطلحات مستبعدة:"],
];

const exact: Record<string, string> = {
  "Region is unknown until public details are enriched.":
    "المنطقة غير معروفة حتى يتم إثراء التفاصيل العامة.",
  "Submission deadline is within 30 days.":
    "آخر موعد للتقديم خلال 30 يوماً.",
  "Submission deadline is less than 7 days away.":
    "يتبقى أقل من 7 أيام على آخر موعد للتقديم.",
  "Submission deadline has passed.": "انتهى آخر موعد للتقديم.",
  "Submission deadline is not publicly provided.":
    "آخر موعد للتقديم غير متاح للعامة.",
};

export function localizeMatchText(text: string, locale: Locale): string {
  if (locale === "en") {
    return text;
  }

  if (exact[text]) {
    return exact[text];
  }

  for (const [english, arabic] of replacements) {
    if (text.startsWith(english)) {
      return text.replace(english, arabic);
    }
  }

  return pick(locale, text, text);
}
