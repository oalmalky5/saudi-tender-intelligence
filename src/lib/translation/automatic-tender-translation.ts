import type { PrismaClient } from "@/generated/prisma/client";
import { evaluateTenderTranslation } from "@/lib/ai/evaluate-tender-translation";
import {
  buildTenderTranslationSource,
  hashTenderTranslationSource,
} from "@/lib/ai/tender-translation-source";

import {
  AZURE_TRANSLATION_MODEL,
  AZURE_TRANSLATION_VERSION,
  azureTranslatorConfigured,
  translateTenderSourceWithAzure,
} from "./azure-translator";

export type AutomaticTranslationResult = {
  translated: number;
  cached: number;
  failed: number;
  failures: Array<{ tenderId: string; reason: string }>;
  skippedNotConfigured: boolean;
};

export async function automaticallyTranslateTenders(
  db: PrismaClient,
  tenderIds: string[],
  limit = 50,
): Promise<AutomaticTranslationResult> {
  if (!azureTranslatorConfigured()) {
    return {
      translated: 0,
      cached: 0,
      failed: 0,
      failures: [],
      skippedNotConfigured: true,
    };
  }

  const tenders = await db.tender.findMany({
    where: { id: { in: tenderIds } },
    orderBy: { publishedAt: "desc" },
    take: limit,
    select: {
      id: true,
      titleArabic: true,
      descriptionArabic: true,
      translations: {
        where: { provider: "AZURE" },
        select: { sourceHash: true },
      },
    },
  });
  let translated = 0;
  let cached = 0;
  let failed = 0;
  const failures: Array<{ tenderId: string; reason: string }> = [];

  for (const tender of tenders) {
    const source = buildTenderTranslationSource(tender);
    const sourceHash = hashTenderTranslationSource(source);
    if (tender.translations.some((translation) => translation.sourceHash === sourceHash)) {
      cached += 1;
      continue;
    }

    try {
      const generation = await translateTenderSourceWithAzure(source);
      const evaluation = evaluateTenderTranslation(source, generation.content);
      if (!evaluation.passed) {
        throw new Error(
          `Automatic translation failed checks: ${evaluation.issues.join(" ")}`,
        );
      }

      await db.$transaction([
        db.tenderTranslation.create({
          data: {
            tenderId: tender.id,
            ...generation.content,
            sourceHash,
            provider: "AZURE",
            translationType: "AUTOMATIC",
            model: AZURE_TRANSLATION_MODEL,
            promptVersion: AZURE_TRANSLATION_VERSION,
            characterCount: generation.characterCount,
          },
        }),
        db.tender.update({
          where: { id: tender.id },
          data: generation.content,
        }),
      ]);
      translated += 1;
    } catch (error) {
      failed += 1;
      failures.push({
        tenderId: tender.id,
        reason: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return {
    translated,
    cached,
    failed,
    failures,
    skippedNotConfigured: false,
  };
}
