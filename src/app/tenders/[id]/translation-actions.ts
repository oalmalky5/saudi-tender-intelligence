"use server";

import { evaluateTenderTranslation } from "@/lib/ai/evaluate-tender-translation";
import {
  generateTenderTranslation,
  TENDER_TRANSLATION_PROMPT_VERSION,
} from "@/lib/ai/generate-tender-translation";
import {
  buildTenderTranslationSource,
  hashTenderTranslationSource,
} from "@/lib/ai/tender-translation-source";
import { parseLocale, pick } from "@/lib/i18n/locale";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type TranslationActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

export async function translateTenderAction(
  _previousState: TranslationActionState,
  formData: FormData,
): Promise<TranslationActionState> {
  const locale = parseLocale(
    typeof formData.get("locale") === "string"
      ? String(formData.get("locale"))
      : undefined,
  );

  try {
    const tenderId = formData.get("tenderId");

    if (typeof tenderId !== "string" || !tenderId.trim()) {
      throw new Error("Tender ID is required.");
    }

    const tender = await prisma.tender.findUnique({ where: { id: tenderId } });

    if (!tender) {
      return {
        status: "error",
        message: pick(locale, "Tender not found.", "لم يتم العثور على المنافسة."),
      };
    }

    const source = buildTenderTranslationSource(tender);
    const sourceHash = hashTenderTranslationSource(source);
    const cached = await prisma.tenderTranslation.findFirst({
      where: {
        tenderId: tender.id,
        sourceHash,
        promptVersion: TENDER_TRANSLATION_PROMPT_VERSION,
      },
      orderBy: { generatedAt: "desc" },
    });

    if (cached) {
      await prisma.tender.update({
        where: { id: tender.id },
        data: {
          titleEnglish: cached.titleEnglish,
          descriptionEnglish: cached.descriptionEnglish,
        },
      });
      revalidatePath(`/tenders/${tender.id}`);
      revalidatePath("/tenders");

      return {
        status: "success",
        message: pick(
          locale,
          "The current cached translation was restored. No API request was made.",
          "تمت استعادة الترجمة المخزنة الحالية دون إجراء طلب للواجهة البرمجية.",
        ),
      };
    }

    const generation = await generateTenderTranslation(source);
    const evaluation = evaluateTenderTranslation(source, generation.content);

    if (!evaluation.passed) {
      throw new Error(
        `Translation failed deterministic checks: ${evaluation.issues.join(" ")}`,
      );
    }

    await prisma.$transaction([
      prisma.tenderTranslation.create({
        data: {
          tenderId: tender.id,
          titleEnglish: generation.content.titleEnglish,
          descriptionEnglish: generation.content.descriptionEnglish,
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
        data: {
          titleEnglish: generation.content.titleEnglish,
          descriptionEnglish: generation.content.descriptionEnglish,
        },
      }),
    ]);

    revalidatePath(`/tenders/${tender.id}`);
    revalidatePath("/tenders");

    return {
      status: "success",
      message: pick(
        locale,
        "A faithful English translation was generated and stored.",
        "تم إنشاء ترجمة إنجليزية أمينة وتخزينها.",
      ),
    };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "The tender could not be translated.",
    };
  }
}
