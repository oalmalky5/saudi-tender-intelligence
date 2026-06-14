import { evaluateBookletAnalysis } from "../src/lib/ai/evaluate-booklet-analysis";
import { evaluateTenderChatAnswer } from "../src/lib/ai/evaluate-tender-chat";
import { evaluateTenderMatching } from "../src/lib/ai/evaluate-tender-matching";
import { evaluateTenderSummary } from "../src/lib/ai/evaluate-tender-summary";
import { evaluateTenderTranslation } from "../src/lib/ai/evaluate-tender-translation";
import { evaluateWeeklyTenderReport } from "../src/lib/ai/evaluate-weekly-report";
import { scoreTenderMatch } from "../src/lib/matching/score-tender";
import { prisma } from "../src/lib/prisma";

type AuditResult = {
  feature: string;
  id: string;
  promptVersion: string;
  passed: boolean;
  issues: string[];
  estimatedCostUsd: number;
};

function cost(value: { toString(): string } | null): number {
  return value ? Number(value.toString()) : 0;
}

async function auditStoredOutputs(): Promise<AuditResult[]> {
  const [
    summaries,
    translations,
    matchRuns,
    chatRuns,
    reports,
    bookletAnalyses,
  ] = await Promise.all([
    prisma.tenderAiSummary.findMany({
      include: {
        tender: {
          select: {
            titleArabic: true,
            descriptionArabic: true,
            agencyNameArabic: true,
            activityNameArabic: true,
            classificationFieldArabic: true,
            executionRegionArabic: true,
            tenderTypeNameArabic: true,
            detailEnrichmentStatus: true,
            submissionDeadline: true,
          },
        },
        companyProfile: true,
      },
    }),
    prisma.tenderTranslation.findMany({
      include: {
        tender: {
          select: { titleArabic: true, descriptionArabic: true },
        },
      },
    }),
    prisma.tenderAiMatchRun.findMany({
      include: {
        companyProfile: true,
        matches: {
          include: {
            tender: {
              select: {
                titleArabic: true,
                descriptionArabic: true,
                agencyNameArabic: true,
                activityNameArabic: true,
                classificationFieldArabic: true,
                executionRegionArabic: true,
                tenderTypeNameArabic: true,
                submissionDeadline: true,
                detailEnrichmentStatus: true,
              },
            },
          },
        },
      },
    }),
    prisma.tenderChatRun.findMany({ include: { citations: true } }),
    prisma.weeklyTenderReport.findMany({ include: { tenders: true } }),
    prisma.tenderBookletAnalysis.findMany({
      include: {
        booklet: { include: { pages: true } },
      },
    }),
  ]);

  const results: AuditResult[] = [];

  for (const summary of summaries) {
    const evaluation = evaluateTenderSummary({
      content: summary.content,
      detailEnrichmentStatus: summary.tender.detailEnrichmentStatus,
      submissionDeadline: summary.tender.submissionDeadline,
      hasCompanyProfile: summary.companyProfileId !== null,
      hasDirectScopeMatch: summary.companyProfile
        ? scoreTenderMatch(summary.companyProfile, summary.tender).hasDirectScopeMatch
        : undefined,
    });
    results.push({
      feature: "summary",
      id: summary.id,
      promptVersion: summary.promptVersion,
      ...evaluation,
      estimatedCostUsd: cost(summary.estimatedCostUsd),
    });
  }

  for (const translation of translations) {
    const evaluation = evaluateTenderTranslation(
      {
        titleArabic: translation.tender.titleArabic,
        descriptionArabic: translation.tender.descriptionArabic,
      },
      {
        titleEnglish: translation.titleEnglish,
        descriptionEnglish: translation.descriptionEnglish,
      },
    );
    results.push({
      feature: "translation",
      id: translation.id,
      promptVersion: translation.promptVersion,
      ...evaluation,
      estimatedCostUsd: cost(translation.estimatedCostUsd),
    });
  }

  for (const run of matchRuns) {
    const directScopeByTenderId = new Map(
      run.matches.map((match) => [
        match.tenderId,
        scoreTenderMatch(run.companyProfile, match.tender).hasDirectScopeMatch,
      ]),
    );
    const evaluation = evaluateTenderMatching(
      run.matches.map((match) => match.tenderId),
      {
        matches: run.matches
          .sort((left, right) => left.rank - right.rank)
          .map((match) => ({
            tenderId: match.tenderId,
            relevanceScore: match.relevanceScore,
            whyMatches: match.whyMatches,
            whyMayNotMatch: match.whyMayNotMatch,
            whatToCheckNext: match.whatToCheckNext,
            recommendedAction: match.recommendedAction,
            confidence: match.confidence,
          })),
      },
      directScopeByTenderId,
    );
    results.push({
      feature: "matching",
      id: run.id,
      promptVersion: run.promptVersion,
      ...evaluation,
      estimatedCostUsd: cost(run.estimatedCostUsd),
    });
  }

  for (const run of chatRuns) {
    const evaluation = evaluateTenderChatAnswer(
      run.citations.map((citation) => citation.tenderId),
      run.content,
    );
    results.push({
      feature: "chat",
      id: run.id,
      promptVersion: run.promptVersion,
      ...evaluation,
      estimatedCostUsd: cost(run.estimatedCostUsd),
    });
  }

  for (const report of reports) {
    const evaluation = evaluateWeeklyTenderReport(
      report.tenders.map((tender) => tender.tenderId),
      report.content,
    );
    results.push({
      feature: "weekly-report",
      id: report.id,
      promptVersion: report.promptVersion,
      ...evaluation,
      estimatedCostUsd: cost(report.estimatedCostUsd),
    });
  }

  for (const analysis of bookletAnalyses) {
    const evaluation = evaluateBookletAnalysis(
      analysis.booklet.pages,
      analysis.content,
    );
    results.push({
      feature: "booklet-analysis",
      id: analysis.id,
      promptVersion: analysis.promptVersion,
      ...evaluation,
      estimatedCostUsd: cost(analysis.estimatedCostUsd),
    });
  }

  return results;
}

async function main(): Promise<void> {
  const results = await auditStoredOutputs();
  const passed = results.filter((result) => result.passed);
  const failed = results.filter((result) => !result.passed);
  const totalCost = results.reduce(
    (total, result) => total + result.estimatedCostUsd,
    0,
  );
  const coverage = Object.entries(
    results.reduce<Record<string, number>>((counts, result) => {
      counts[result.feature] = (counts[result.feature] ?? 0) + 1;
      return counts;
    }, {}),
  );

  console.log("Stored AI Output Audit");
  console.log("======================");
  console.log(`Outputs audited: ${results.length}`);
  console.log(`Current guardrails passed: ${passed.length}`);
  console.log(`Current guardrails failed: ${failed.length}`);
  console.log(`Recorded estimated cost: $${totalCost.toFixed(6)}`);
  console.log(
    `Coverage: ${coverage.map(([feature, count]) => `${feature}=${count}`).join(", ")}`,
  );

  for (const result of failed) {
    console.log("");
    console.log(
      `FAIL | ${result.feature} | ${result.promptVersion} | ${result.id}`,
    );
    for (const issue of result.issues) {
      console.log(`  - ${issue}`);
    }
  }
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
