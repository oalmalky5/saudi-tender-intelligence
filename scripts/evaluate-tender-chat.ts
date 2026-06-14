import { evaluateTenderChatAnswer } from "../src/lib/ai/evaluate-tender-chat";
import { generateTenderChatAnswer } from "../src/lib/ai/generate-tender-chat";
import { buildTenderChatContext } from "../src/lib/chat/chat-context";
import { buildTenderChatRetrievalPlan } from "../src/lib/chat/retrieval-plan";
import { retrieveTendersForChat } from "../src/lib/chat/retrieve-tenders";
import { prisma } from "../src/lib/prisma";

async function main(): Promise<void> {
  const question =
    process.argv.slice(2).join(" ").trim() ||
    "What tenders are closing this week?";
  const plan = buildTenderChatRetrievalPlan(question);
  const retrieval = await retrieveTendersForChat(plan);
  const generation = await generateTenderChatAnswer(
    buildTenderChatContext(
      question,
      { ...plan, limitation: retrieval.limitation },
      retrieval.tenders,
      retrieval.profile,
    ),
  );
  const evaluation = evaluateTenderChatAnswer(
    retrieval.tenders.map((tender) => tender.id),
    generation.content,
  );

  console.log(
    JSON.stringify(
      {
        question,
        retrieval: {
          plan,
          tenderCount: retrieval.tenders.length,
          referenceNumbers: retrieval.tenders.map(
            (tender) => tender.referenceNumber,
          ),
        },
        answer: generation.content,
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
