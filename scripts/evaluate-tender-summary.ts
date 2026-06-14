import {
  generateTenderSummary,
  TENDER_SUMMARY_PROMPT_VERSION,
} from "../src/lib/ai/generate-tender-summary";
import { evaluateTenderSummary } from "../src/lib/ai/evaluate-tender-summary";
import { buildTenderSummaryContext } from "../src/lib/ai/tender-summary-context";
import { scoreTenderMatch } from "../src/lib/matching/score-tender";
import { prisma } from "../src/lib/prisma";

async function main(): Promise<void> {
  const referenceNumber = process.argv[2];

  if (!referenceNumber) {
    throw new Error(
      "Provide a tender reference number: npm run ai:evaluate -- <reference-number>",
    );
  }

  const [tender, companyProfile] = await Promise.all([
    prisma.tender.findUnique({
      where: { referenceNumber },
      include: { attachments: { select: { nameArabic: true } } },
    }),
    prisma.companyProfile.findUnique({ where: { id: "primary" } }),
  ]);

  if (!tender) {
    throw new Error(`Tender ${referenceNumber} was not found.`);
  }

  console.log(`Generating summary for ${tender.referenceNumber}: ${tender.titleArabic}`);
  const generation = await generateTenderSummary(
    buildTenderSummaryContext(tender, companyProfile),
  );
  const evaluation = evaluateTenderSummary({
    content: generation.content,
    detailEnrichmentStatus: tender.detailEnrichmentStatus,
    submissionDeadline: tender.submissionDeadline,
    hasCompanyProfile: companyProfile !== null,
    hasDirectScopeMatch: companyProfile
      ? scoreTenderMatch(companyProfile, tender).hasDirectScopeMatch
      : undefined,
  });

  if (!evaluation.passed) {
    throw new Error(
      `Summary failed deterministic checks: ${evaluation.issues.join(" ")}`,
    );
  }

  await prisma.tenderAiSummary.create({
    data: {
      workspaceId: "primary-workspace",
      tenderId: tender.id,
      companyProfileId: companyProfile?.id ?? null,
      content: JSON.parse(JSON.stringify(generation.content)),
      model: generation.model,
      promptVersion: TENDER_SUMMARY_PROMPT_VERSION,
      openaiResponseId: generation.openaiResponseId,
      inputTokens: generation.inputTokens,
      outputTokens: generation.outputTokens,
      totalTokens: generation.totalTokens,
      estimatedCostUsd: generation.estimatedCostUsd,
      sourceTenderUpdatedAt: tender.updatedAt,
      sourceCompanyProfileUpdatedAt: companyProfile?.updatedAt ?? null,
    },
  });

  console.log(JSON.stringify(generation.content, null, 2));
  console.log(
    JSON.stringify(
      {
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
