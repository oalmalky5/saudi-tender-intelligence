import {
  tenderChatAnswerSchema,
  type TenderChatAnswer,
} from "./tender-chat-schema";

export type TenderChatEvaluation = {
  passed: boolean;
  issues: string[];
};

const overclaimPattern =
  /\b(guaranteed|will win|eligible to bid|eligibility confirmed|definitely qualifies)\b/i;

export function evaluateTenderChatAnswer(
  retrievedTenderIds: string[],
  content: unknown,
): TenderChatEvaluation {
  const parsed = tenderChatAnswerSchema.safeParse(content);
  if (!parsed.success) {
    return { passed: false, issues: ["Output does not match the chat schema."] };
  }

  const issues: string[] = [];
  const answer: TenderChatAnswer = parsed.data;
  const allowedIds = new Set(retrievedTenderIds);

  if (answer.unsupported && answer.citations.length > 0) {
    issues.push("Unsupported answer contains tender citations.");
  }
  if (!answer.unsupported && retrievedTenderIds.length > 0 && answer.citations.length === 0) {
    issues.push("Supported answer contains no tender citations.");
  }
  if (retrievedTenderIds.length === 0 && !answer.unsupported) {
    issues.push("Answer claims support when no tenders were retrieved.");
  }
  if (overclaimPattern.test(answer.answer)) {
    issues.push("Answer contains an eligibility or winning-probability overclaim.");
  }

  for (const tenderId of retrievedTenderIds) {
    if (answer.answer.includes(tenderId)) {
      issues.push(`Answer prose exposes internal tender ID ${tenderId}.`);
    }
  }

  for (const citation of answer.citations) {
    if (!allowedIds.has(citation.tenderId)) {
      issues.push(`Citation references unretrieved tender ${citation.tenderId}.`);
    }
  }

  return { passed: issues.length === 0, issues };
}
