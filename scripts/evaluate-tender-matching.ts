import { evaluateTenderMatching } from "../src/lib/ai/evaluate-tender-matching";
import {
  generateTenderMatching,
  TENDER_MATCHING_PROMPT_VERSION,
} from "../src/lib/ai/generate-tender-matching";
import { buildTenderMatchingContext } from "../src/lib/ai/tender-matching-context";
import { selectAiMatchingCandidates } from "../src/lib/matching/select-ai-candidates";
import { prisma } from "../src/lib/prisma";

async function main(): Promise<void> {
  const [profile, tenders] = await Promise.all([
    prisma.companyProfile.findUnique({ where: { id: "primary" } }),
    prisma.tender.findMany({
      where: { NOT: { decision: { is: { status: "IGNORED" } } } },
      orderBy: { publishedAt: "desc" },
      take: 120,
      select: {
        id: true,
        referenceNumber: true,
        titleArabic: true,
        titleEnglish: true,
        descriptionArabic: true,
        descriptionEnglish: true,
        agencyNameArabic: true,
        branchNameArabic: true,
        tenderTypeNameArabic: true,
        tenderStatusNameArabic: true,
        activityNameArabic: true,
        classificationFieldArabic: true,
        executionRegionArabic: true,
        executionCityArabic: true,
        publishedAt: true,
        submissionDeadline: true,
        detailEnrichmentStatus: true,
        updatedAt: true,
      },
    }),
  ]);

  if (!profile) {
    throw new Error("Create the primary company profile before evaluating matching.");
  }

  const candidates = selectAiMatchingCandidates(profile, tenders, 10).map(
    ({ tender, deterministicMatch }) => ({ ...tender, deterministicMatch }),
  );

  if (candidates.length === 0) {
    throw new Error("No positive rule-based candidates are available.");
  }

  console.log(`Reviewing ${candidates.length} candidates for ${profile.companyName}.`);
  const generation = await generateTenderMatching(
    buildTenderMatchingContext(profile, candidates),
  );
  const evaluation = evaluateTenderMatching(
    candidates.map((candidate) => candidate.id),
    generation.content,
  );

  if (evaluation.passed) {
    const candidateById = new Map(
      candidates.map((candidate) => [candidate.id, candidate]),
    );

    await prisma.tenderAiMatchRun.create({
      data: {
        companyProfileId: profile.id,
        model: generation.model,
        promptVersion: TENDER_MATCHING_PROMPT_VERSION,
        openaiResponseId: generation.openaiResponseId,
        candidateCount: candidates.length,
        inputTokens: generation.inputTokens,
        outputTokens: generation.outputTokens,
        totalTokens: generation.totalTokens,
        estimatedCostUsd: generation.estimatedCostUsd,
        sourceCompanyProfileUpdatedAt: profile.updatedAt,
        matches: {
          create: generation.content.matches.map((match, index) => {
            const candidate = candidateById.get(match.tenderId);
            if (!candidate) {
              throw new Error(`AI returned unknown tender ${match.tenderId}.`);
            }

            return {
              tenderId: match.tenderId,
              rank: index + 1,
              relevanceScore: match.relevanceScore,
              whyMatches: match.whyMatches,
              whyMayNotMatch: match.whyMayNotMatch,
              whatToCheckNext: match.whatToCheckNext,
              recommendedAction: match.recommendedAction,
              confidence: match.confidence,
              deterministicScore: candidate.deterministicMatch.score,
              sourceTenderUpdatedAt: candidate.updatedAt,
            };
          }),
        },
      },
    });
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
