export const MAX_CHAT_TENDERS = 20;

export type TenderChatRetrievalPlan = {
  mode: "closing_soon" | "company_fit" | "reference" | "keyword" | "recent";
  queryTerms: string[];
  referenceNumbers: string[];
  daysUntilDeadline: number | null;
  requiresCompanyProfile: boolean;
};

const stopWords = new Set([
  "a",
  "an",
  "and",
  "are",
  "based",
  "compare",
  "do",
  "does",
  "for",
  "from",
  "in",
  "is",
  "look",
  "me",
  "of",
  "on",
  "our",
  "should",
  "show",
  "that",
  "the",
  "these",
  "this",
  "tender",
  "tenders",
  "to",
  "us",
  "what",
  "which",
  "with",
]);

export function buildTenderChatRetrievalPlan(
  question: string,
): TenderChatRetrievalPlan {
  const normalized = question.toLocaleLowerCase();
  const referenceNumbers = [
    ...new Set(question.match(/\b\d{8,}\b/g) ?? []),
  ];
  const companyFit =
    /\b(fit|relevant|recommend|recommended|prioriti[sz]e|suitable|company profile)\b/i.test(
      question,
    );
  const closingSoon =
    /\b(closing|deadline|due|this week|next week)\b/i.test(question);
  const queryTerms = [
    ...new Set(
      normalized
        .replace(/[^\p{L}\p{N}\s]/gu, " ")
        .split(/\s+/)
        .filter((term) => term.length >= 3 && !stopWords.has(term)),
    ),
  ].slice(0, 8);

  return {
    mode:
      referenceNumbers.length > 0
        ? "reference"
        : companyFit
          ? "company_fit"
          : closingSoon
            ? "closing_soon"
            : queryTerms.length > 0
              ? "keyword"
              : "recent",
    queryTerms,
    referenceNumbers,
    daysUntilDeadline: closingSoon ? (/next week/i.test(question) ? 14 : 7) : null,
    requiresCompanyProfile: companyFit,
  };
}
