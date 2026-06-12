import { evaluateTenderTranslation } from "../src/lib/ai/evaluate-tender-translation";
import {
  generateTenderTranslation,
  TENDER_TRANSLATION_PROMPT_VERSION,
} from "../src/lib/ai/generate-tender-translation";
import {
  buildTenderTranslationSource,
  hashTenderTranslationSource,
} from "../src/lib/ai/tender-translation-source";
import { prisma } from "../src/lib/prisma";

async function main(): Promise<void> {
  const referenceNumber = process.argv[2];

  if (!referenceNumber) {
    throw new Error(
      "Provide a tender reference number: npm run ai:translate:evaluate -- <reference-number>",
    );
  }

  const tender = await prisma.tender.findUnique({ where: { referenceNumber } });

  if (!tender) {
    throw new Error(`Tender ${referenceNumber} was not found.`);
  }

  const source = buildTenderTranslationSource(tender);
  const sourceHash = hashTenderTranslationSource(source);

  console.log(`Translating ${tender.referenceNumber}: ${tender.titleArabic}`);
  const generation = await generateTenderTranslation(source);
  const evaluation = evaluateTenderTranslation(source, generation.content);

  if (evaluation.passed) {
    await prisma.$transaction([
      prisma.tenderTranslation.create({
        data: {
          tenderId: tender.id,
          ...generation.content,
          sourceHash,
          model: generation.model,
          promptVersion: TENDER_TRANSLATION_PROMPT_VERSION,
          openaiResponseId: generation.openaiResponseId,
          inputTokens: generation.inputTokens,
          outputTokens: generation.outputTokens,
          totalTokens: generation.totalTokens,
          estimatedCostUsd: generation.estimatedCostUsd,
        },
      }),
      prisma.tender.update({
        where: { id: tender.id },
        data: generation.content,
      }),
    ]);
  }

  console.log(JSON.stringify(generation.content, null, 2));
  console.log(
    JSON.stringify(
      {
        stored: evaluation.passed,
        evaluation,
        usage: {
          model: generation.model,
          inputTokens: generation.inputTokens,
          outputTokens: generation.outputTokens,
          totalTokens: generation.totalTokens,
          estimatedCostUsd: generation.estimatedCostUsd,
        },
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
