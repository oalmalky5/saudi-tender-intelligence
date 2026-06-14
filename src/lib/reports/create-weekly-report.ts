import type { PrismaClient } from "@/generated/prisma/client";
import { evaluateWeeklyTenderReport } from "@/lib/ai/evaluate-weekly-report";
import {
  generateWeeklyTenderReport,
  WEEKLY_REPORT_PROMPT_VERSION,
} from "@/lib/ai/generate-weekly-report";

import {
  buildWeeklyReportContext,
  selectWeeklyReportCandidates,
} from "./weekly-report-context";
import { renderWeeklyReportMarkdown } from "./render-weekly-report-markdown";

export async function createWeeklyTenderReport(
  db: PrismaClient,
  dateFrom: Date,
  dateTo: Date,
) {
  const [profile, tenders] = await Promise.all([
    db.companyProfile.findUnique({ where: { id: "primary" } }),
    db.tender.findMany({
      where: { NOT: { decision: { is: { status: "IGNORED" } } } },
      orderBy: { publishedAt: "desc" },
      take: 250,
      select: {
        id: true,
        referenceNumber: true,
        titleArabic: true,
        titleEnglish: true,
        descriptionArabic: true,
        descriptionEnglish: true,
        agencyNameArabic: true,
        tenderTypeNameArabic: true,
        tenderStatusNameArabic: true,
        activityNameArabic: true,
        classificationFieldArabic: true,
        executionRegionArabic: true,
        publishedAt: true,
        submissionDeadline: true,
        detailEnrichmentStatus: true,
        updatedAt: true,
        decision: { select: { status: true, note: true } },
      },
    }),
  ]);
  if (!profile) {
    throw new Error("Create a company profile before generating a weekly report.");
  }

  const candidates = selectWeeklyReportCandidates(
    profile,
    tenders,
    dateFrom,
    dateTo,
    new Date(),
    20,
  );
  if (candidates.length === 0) {
    throw new Error("No tenders are available for the weekly report.");
  }

  const generation = await generateWeeklyTenderReport(
    buildWeeklyReportContext(profile, candidates, dateFrom, dateTo),
  );
  const evaluation = evaluateWeeklyTenderReport(
    candidates.map((candidate) => candidate.id),
    generation.content,
  );
  if (!evaluation.passed) {
    throw new Error(
      `Weekly report failed deterministic checks: ${evaluation.issues.join(" ")}`,
    );
  }
  const candidateById = new Map(
    candidates.map((candidate) => [candidate.id, candidate]),
  );
  const markdown = renderWeeklyReportMarkdown(
    generation.content,
    profile.companyName,
    dateFrom,
    dateTo,
    candidates,
  );

  return db.weeklyTenderReport.create({
    data: {
      companyProfileId: profile.id,
      dateFrom,
      dateTo,
      content: JSON.parse(JSON.stringify(generation.content)),
      markdown,
      model: generation.model,
      promptVersion: WEEKLY_REPORT_PROMPT_VERSION,
      openaiResponseId: generation.openaiResponseId,
      candidateCount: candidates.length,
      inputTokens: generation.inputTokens,
      outputTokens: generation.outputTokens,
      totalTokens: generation.totalTokens,
      estimatedCostUsd: generation.estimatedCostUsd,
      sourceCompanyProfileUpdatedAt: profile.updatedAt,
      tenders: {
        create: generation.content.tenderReviews.map((review) => {
          const tender = candidateById.get(review.tenderId);
          if (!tender) {
            throw new Error(`AI returned unknown tender ${review.tenderId}.`);
          }
          return {
            tenderId: tender.id,
            categories: review.categories,
            sourceTenderUpdatedAt: tender.updatedAt,
          };
        }),
      },
    },
    include: { tenders: true },
  });
}
