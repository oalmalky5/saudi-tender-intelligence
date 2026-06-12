import {
  tenderTranslationSchema,
  type TenderTranslationContent,
} from "./tender-translation-schema";
import type { TenderTranslationSource } from "./tender-translation-source";

export type TenderTranslationEvaluation = {
  passed: boolean;
  issues: string[];
};

function normalized(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function sourceNumbers(source: TenderTranslationSource): string[] {
  return [
    ...source.titleArabic.matchAll(/\d+(?:[.,]\d+)*/g),
    ...(source.descriptionArabic?.matchAll(/\d+(?:[.,]\d+)*/g) ?? []),
  ].map((match) => match[0]);
}

export function evaluateTenderTranslation(
  source: TenderTranslationSource,
  content: unknown,
): TenderTranslationEvaluation {
  const parsed = tenderTranslationSchema.safeParse(content);

  if (!parsed.success) {
    return {
      passed: false,
      issues: ["Output does not match the translation schema."],
    };
  }

  const issues: string[] = [];
  const translation: TenderTranslationContent = parsed.data;
  const allEnglish = [
    translation.titleEnglish,
    translation.descriptionEnglish ?? "",
  ].join(" ");

  if (
    source.descriptionArabic === null &&
    translation.descriptionEnglish !== null
  ) {
    issues.push("A description was invented when the source description was null.");
  }

  if (
    normalized(translation.titleEnglish) === normalized(source.titleArabic)
  ) {
    issues.push("The title was returned unchanged instead of translated.");
  }

  for (const number of new Set(sourceNumbers(source))) {
    if (!allEnglish.includes(number)) {
      issues.push(`Source number ${number} is missing from the translation.`);
    }
  }

  return { passed: issues.length === 0, issues };
}
