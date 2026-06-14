"use server";

import { buildTenderChatContext } from "@/lib/chat/chat-context";
import { buildTenderChatRetrievalPlan } from "@/lib/chat/retrieval-plan";
import { retrieveTendersForChat } from "@/lib/chat/retrieve-tenders";
import { evaluateTenderChatAnswer } from "@/lib/ai/evaluate-tender-chat";
import {
  generateTenderChatAnswer,
  TENDER_CHAT_PROMPT_VERSION,
} from "@/lib/ai/generate-tender-chat";
import { parseLocale, pick } from "@/lib/i18n/locale";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type TenderChatActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

export async function askTenderDatabaseAction(
  _previousState: TenderChatActionState,
  formData: FormData,
): Promise<TenderChatActionState> {
  const locale = parseLocale(
    typeof formData.get("locale") === "string"
      ? String(formData.get("locale"))
      : undefined,
  );

  try {
    const questionValue = formData.get("question");
    if (typeof questionValue !== "string") {
      throw new Error("Question is required.");
    }
    const question = questionValue.trim();
    if (question.length < 5 || question.length > 2_000) {
      throw new Error("Question must contain between 5 and 2,000 characters.");
    }

    const plan = buildTenderChatRetrievalPlan(question);
    const retrieval = await retrieveTendersForChat(plan);
    const context = buildTenderChatContext(
      question,
      { ...plan, limitation: retrieval.limitation },
      retrieval.tenders,
      retrieval.profile,
    );
    const generation = await generateTenderChatAnswer(context);
    const tenderIds = retrieval.tenders.map((tender) => tender.id);
    const evaluation = evaluateTenderChatAnswer(tenderIds, generation.content);

    if (!evaluation.passed) {
      throw new Error(
        `Tender answer failed deterministic checks: ${evaluation.issues.join(" ")}`,
      );
    }

    await prisma.tenderChatRun.create({
      data: {
        question,
        content: JSON.parse(JSON.stringify(generation.content)),
        retrieval: JSON.parse(JSON.stringify({ ...plan, limitation: retrieval.limitation })),
        companyProfileId: retrieval.profile?.id ?? null,
        model: generation.model,
        promptVersion: TENDER_CHAT_PROMPT_VERSION,
        openaiResponseId: generation.openaiResponseId,
        retrievedTenderCount: retrieval.tenders.length,
        inputTokens: generation.inputTokens,
        outputTokens: generation.outputTokens,
        totalTokens: generation.totalTokens,
        estimatedCostUsd: generation.estimatedCostUsd,
        sourceCompanyProfileUpdatedAt: retrieval.profile?.updatedAt ?? null,
        citations: {
          create: generation.content.citations.map((citation) => ({
            tenderId: citation.tenderId,
            claim: citation.claim,
          })),
        },
      },
    });

    revalidatePath("/chat");

    return {
      status: "success",
      message: pick(
        locale,
        "A grounded answer was generated and stored.",
        "تم إنشاء إجابة موثقة وتخزينها.",
      ),
    };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "The tender database question could not be answered.",
    };
  }
}
