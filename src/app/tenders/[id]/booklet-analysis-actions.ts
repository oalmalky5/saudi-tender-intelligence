"use server";

import {
  buildBookletAnalysisContext,
  selectBookletPages,
} from "@/lib/ai/booklet-analysis-context";
import { evaluateBookletAnalysis } from "@/lib/ai/evaluate-booklet-analysis";
import {
  BOOKLET_ANALYSIS_PROMPT_VERSION,
  BOOKLET_ANALYSIS_SCHEMA_VERSION,
  generateBookletAnalysis,
} from "@/lib/ai/generate-booklet-analysis";
import { parseLocale, pick } from "@/lib/i18n/locale";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireWorkspace } from "@/lib/auth/session";
import { enforceWorkspaceRateLimit, RATE_LIMITS } from "@/lib/reliability/rate-limit";

export type BookletAnalysisActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

export async function analyzeTenderBookletAction(
  _previousState: BookletAnalysisActionState,
  formData: FormData,
): Promise<BookletAnalysisActionState> {
  const locale = parseLocale(
    typeof formData.get("locale") === "string"
      ? String(formData.get("locale"))
      : undefined,
  );

  try {
    const { workspace } = await requireWorkspace();
    const bookletId = formData.get("bookletId");
    if (typeof bookletId !== "string" || !bookletId.trim()) {
      throw new Error("Booklet ID is required.");
    }

    const [booklet, profile] = await Promise.all([
      prisma.tenderBooklet.findFirst({
        where: { id: bookletId, workspaceId: workspace.id },
        include: { pages: { orderBy: { pageNumber: "asc" } } },
      }),
      prisma.companyProfile.findUnique({ where: { workspaceId: workspace.id } }),
    ]);

    if (!booklet) {
      throw new Error("Booklet not found.");
    }
    if (booklet.requiresOcr || booklet.extractionStatus !== "complete") {
      throw new Error(
        "This booklet needs OCR or extraction review before AI analysis.",
      );
    }

    const cached = await prisma.tenderBookletAnalysis.findFirst({
      where: {
        bookletId: booklet.id,
        sourceBookletSha256: booklet.sha256,
        promptVersion: BOOKLET_ANALYSIS_PROMPT_VERSION,
        schemaVersion: BOOKLET_ANALYSIS_SCHEMA_VERSION,
        companyProfileId: profile?.id ?? null,
        sourceCompanyProfileUpdatedAt: profile?.updatedAt ?? null,
      },
      orderBy: { generatedAt: "desc" },
      select: { id: true },
    });

    if (cached) {
      return {
        status: "success",
        message: pick(
          locale,
          "The current analysis is already stored. No API request was made.",
          "التحليل الحالي مخزن بالفعل، ولم يتم إجراء طلب للواجهة البرمجية.",
        ),
      };
    }

    await enforceWorkspaceRateLimit(workspace.id, RATE_LIMITS.bookletAnalysis);
    const selectedPages = selectBookletPages(booklet.pages);
    const generation = await generateBookletAnalysis(
      buildBookletAnalysisContext(booklet, selectedPages, profile),
    );
    const evaluation = evaluateBookletAnalysis(selectedPages, generation.content);

    if (!evaluation.passed) {
      throw new Error(
        `Booklet analysis failed deterministic checks: ${evaluation.issues.join(" ")}`,
      );
    }

    await prisma.tenderBookletAnalysis.create({
      data: {
        bookletId: booklet.id,
        companyProfileId: profile?.id ?? null,
        content: JSON.parse(JSON.stringify(generation.content)),
        model: generation.model,
        promptVersion: BOOKLET_ANALYSIS_PROMPT_VERSION,
        schemaVersion: BOOKLET_ANALYSIS_SCHEMA_VERSION,
        openaiResponseId: generation.openaiResponseId,
        inputTokens: generation.inputTokens,
        outputTokens: generation.outputTokens,
        totalTokens: generation.totalTokens,
        estimatedCostUsd: generation.estimatedCostUsd,
        sourceBookletSha256: booklet.sha256,
        sourceCompanyProfileUpdatedAt: profile?.updatedAt ?? null,
        analyzedPageNumbers: selectedPages.map((page) => page.pageNumber),
      },
    });

    revalidatePath(`/tenders/${booklet.tenderId}`);

    return {
      status: "success",
      message: pick(
        locale,
        "A cited English booklet analysis was generated and stored.",
        "تم إنشاء تحليل إنجليزي موثق للكراسة وتخزينه.",
      ),
    };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "The booklet could not be analyzed.",
    };
  }
}
