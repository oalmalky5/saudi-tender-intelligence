"use server";

import { evaluateTenderSummary } from "@/lib/ai/evaluate-tender-summary";
import { generateTenderSummary, TENDER_SUMMARY_PROMPT_VERSION } from "@/lib/ai/generate-tender-summary";
import { buildTenderSummaryContext } from "@/lib/ai/tender-summary-context";
import { prisma } from "@/lib/prisma";
import { parseLocale, pick } from "@/lib/i18n/locale";
import { scoreTenderMatch } from "@/lib/matching/score-tender";
import { revalidatePath } from "next/cache";
import { requireWorkspace } from "@/lib/auth/session";
import { enforceWorkspaceRateLimit, RATE_LIMITS } from "@/lib/reliability/rate-limit";

export type SummaryActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

function readTenderId(formData: FormData): string {
  const value = formData.get("tenderId");

  if (typeof value !== "string" || !value.trim()) {
    throw new Error("Tender ID is required.");
  }

  return value.trim();
}

export async function generateTenderSummaryAction(
  _previousState: SummaryActionState,
  formData: FormData,
): Promise<SummaryActionState> {
  try {
    const { workspace } = await requireWorkspace();
    const tenderId = readTenderId(formData);
    const locale = parseLocale(
      typeof formData.get("locale") === "string"
        ? String(formData.get("locale"))
        : undefined,
    );
    const [tender, companyProfile] = await Promise.all([
      prisma.tender.findUnique({
        where: { id: tenderId },
        include: { attachments: { select: { nameArabic: true } } },
      }),
      prisma.companyProfile.findUnique({ where: { workspaceId: workspace.id } }),
    ]);

    if (!tender) {
      return {
        status: "error",
        message: pick(locale, "Tender not found.", "لم يتم العثور على المنافسة."),
      };
    }

    const context = buildTenderSummaryContext(tender, companyProfile);
    await enforceWorkspaceRateLimit(workspace.id, RATE_LIMITS.paidAi);
    const generation = await generateTenderSummary(context);
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
        workspaceId: workspace.id,
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

    revalidatePath(`/tenders/${tender.id}`);

    return {
      status: "success",
      message: pick(
        locale,
        "A new grounded summary version was generated and stored.",
        "تم إنشاء نسخة جديدة من الملخص الموثق وتخزينها.",
      ),
    };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "The tender summary could not be generated.",
    };
  }
}
