"use server";

import { evaluateTenderMatching } from "@/lib/ai/evaluate-tender-matching";
import {
  generateTenderMatching,
  TENDER_MATCHING_PROMPT_VERSION,
} from "@/lib/ai/generate-tender-matching";
import { buildTenderMatchingContext } from "@/lib/ai/tender-matching-context";
import { parseLocale, pick } from "@/lib/i18n/locale";
import { selectAiMatchingCandidates } from "@/lib/matching/select-ai-candidates";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type AiMatchingActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

export async function generateAiMatchingAction(
  _previousState: AiMatchingActionState,
  formData: FormData,
): Promise<AiMatchingActionState> {
  const locale = parseLocale(
    typeof formData.get("locale") === "string"
      ? String(formData.get("locale"))
      : undefined,
  );

  try {
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
      return {
        status: "error",
        message: pick(
          locale,
          "Create a company profile before running AI matching.",
          "أنشئ ملف الشركة قبل تشغيل المطابقة بالذكاء الاصطناعي.",
        ),
      };
    }

    const candidates = selectAiMatchingCandidates(profile, tenders, 10).map(
      ({ tender, deterministicMatch }) => ({
        ...tender,
        deterministicMatch,
      }),
    );

    if (candidates.length === 0) {
      return {
        status: "error",
        message: pick(
          locale,
          "No tenders are available for AI review.",
          "لا توجد منافسات متاحة لمراجعتها بالذكاء الاصطناعي.",
        ),
      };
    }

    const generation = await generateTenderMatching(
      buildTenderMatchingContext(profile, candidates),
    );
    const candidateIds = candidates.map((candidate) => candidate.id);
    const evaluation = evaluateTenderMatching(candidateIds, generation.content);

    if (!evaluation.passed) {
      throw new Error(
        `AI matching failed deterministic checks: ${evaluation.issues.join(" ")}`,
      );
    }

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

    revalidatePath("/tenders/recommended");

    return {
      status: "success",
      message: pick(
        locale,
        `AI ranked and stored ${candidates.length} shortlisted tenders.`,
        `رتّب الذكاء الاصطناعي ${candidates.length} منافسات مختصرة وخزّن النتائج.`,
      ),
    };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "AI tender matching could not be generated.",
    };
  }
}
