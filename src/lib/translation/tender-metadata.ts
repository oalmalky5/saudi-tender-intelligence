import type { PrismaClient } from "@/generated/prisma/client";
import type { Locale } from "@/lib/i18n/locale";

import {
  azureTranslatorConfigured,
  translateArabicTextsWithAzure,
} from "./azure-translator";

export const METADATA_CATEGORIES = [
  "agency",
  "branch",
  "activity",
  "region",
  "city",
  "status",
  "type",
  "classification",
  "submissionMethod",
  "contractDuration",
  "executionDetails",
  "localContent",
  "attachment",
] as const;

export type MetadataCategory = (typeof METADATA_CATEGORIES)[number];
export type MetadataTranslationMap = Map<string, string>;

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function metadataKey(category: MetadataCategory, sourceText: string): string {
  return `${category}:${sourceText}`;
}

export function localizedMetadata(
  translations: MetadataTranslationMap,
  category: MetadataCategory,
  sourceText: string | null,
  locale: Locale,
): string | null {
  if (!sourceText || locale === "ar") return sourceText;
  return translations.get(metadataKey(category, sourceText)) ?? sourceText;
}

export async function loadMetadataTranslations(
  db: PrismaClient,
): Promise<MetadataTranslationMap> {
  const translations = await db.tenderMetadataTranslation.findMany({
    select: { category: true, sourceText: true, englishText: true },
  });
  return new Map(
    translations.map((translation) => [
      metadataKey(
        translation.category as MetadataCategory,
        translation.sourceText,
      ),
      translation.englishText,
    ]),
  );
}

export async function translateTenderMetadata(
  db: PrismaClient,
): Promise<{ translated: number; skipped: number }> {
  if (!azureTranslatorConfigured()) {
    return { translated: 0, skipped: 0 };
  }

  const tenders = await db.tender.findMany({
    select: {
      agencyNameArabic: true,
      branchNameArabic: true,
      activityNameArabic: true,
      executionRegionArabic: true,
      executionCityArabic: true,
      tenderStatusNameArabic: true,
      tenderTypeNameArabic: true,
      classificationFieldArabic: true,
      submissionMethodArabic: true,
      contractDurationArabic: true,
      executionDetailsArabic: true,
      localContentRequirementsArabic: true,
      attachments: { select: { nameArabic: true } },
    },
  });
  const governmentAgencies = await db.governmentAgency.findMany({
    select: { nameArabic: true },
  });
  const values = new Map<string, { category: MetadataCategory; sourceText: string }>();
  for (const agency of governmentAgencies) {
    values.set(metadataKey("agency", agency.nameArabic), {
      category: "agency",
      sourceText: agency.nameArabic,
    });
  }
  for (const tender of tenders) {
    const candidates: Array<[MetadataCategory, string | null]> = [
      ["agency", tender.agencyNameArabic],
      ["branch", tender.branchNameArabic],
      ["activity", tender.activityNameArabic],
      ["region", tender.executionRegionArabic],
      ["city", tender.executionCityArabic],
      ["status", tender.tenderStatusNameArabic],
      ["type", tender.tenderTypeNameArabic],
      ["classification", tender.classificationFieldArabic],
      ["submissionMethod", tender.submissionMethodArabic],
      ["contractDuration", tender.contractDurationArabic],
      ["executionDetails", tender.executionDetailsArabic],
      ["localContent", tender.localContentRequirementsArabic],
    ];
    for (const attachment of tender.attachments) {
      candidates.push(["attachment", attachment.nameArabic]);
    }
    for (const [category, sourceText] of candidates) {
      if (sourceText) values.set(metadataKey(category, sourceText), { category, sourceText });
    }
  }

  const existing = await db.tenderMetadataTranslation.findMany({
    select: { category: true, sourceText: true },
  });
  const existingKeys = new Set(
    existing.map((item) =>
      metadataKey(item.category as MetadataCategory, item.sourceText),
    ),
  );
  const pending = [...values.entries()]
    .filter(([key]) => !existingKeys.has(key))
    .map(([, value]) => value);

  let translated = 0;
  for (let index = 0; index < pending.length;) {
    const batch: typeof pending = [];
    let characters = 0;
    while (
      index < pending.length &&
      batch.length < 50 &&
      characters + pending[index].sourceText.length <= 40_000
    ) {
      batch.push(pending[index]);
      characters += pending[index].sourceText.length;
      index += 1;
    }
    if (batch.length === 0) {
      batch.push(pending[index]);
      index += 1;
    }
    const englishTexts = await translateArabicTextsWithAzure(
      batch.map((item) => item.sourceText),
    );
    await db.tenderMetadataTranslation.createMany({
      data: batch.map((item, itemIndex) => ({
        ...item,
        englishText: englishTexts[itemIndex],
      })),
      skipDuplicates: true,
    });
    translated += batch.length;
    if (index < pending.length) {
      await wait(750);
    }
  }

  return { translated, skipped: existingKeys.size };
}
