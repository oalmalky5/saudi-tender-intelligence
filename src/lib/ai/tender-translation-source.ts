import { createHash } from "node:crypto";

export type TenderTranslationSource = {
  titleArabic: string;
  descriptionArabic: string | null;
};

export function buildTenderTranslationSource(
  tender: TenderTranslationSource,
): TenderTranslationSource {
  return {
    titleArabic: tender.titleArabic,
    descriptionArabic: tender.descriptionArabic,
  };
}

export function hashTenderTranslationSource(
  source: TenderTranslationSource,
): string {
  return createHash("sha256")
    .update(JSON.stringify(source))
    .digest("hex");
}
