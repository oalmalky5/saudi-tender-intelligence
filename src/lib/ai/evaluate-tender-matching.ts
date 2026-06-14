import {
  tenderAiMatchingSchema,
  type TenderAiMatchingContent,
} from "./tender-matching-schema";

export type TenderMatchingEvaluation = {
  passed: boolean;
  issues: string[];
};

const eligibilityOverclaimPattern =
  /\b(eligible|eligibility confirmed|guaranteed|likely to win|will win|qualified to bid)\b/i;

export function evaluateTenderMatching(
  candidateIds: string[],
  content: unknown,
): TenderMatchingEvaluation {
  const parsed = tenderAiMatchingSchema.safeParse(content);

  if (!parsed.success) {
    return {
      passed: false,
      issues: ["Output does not match the AI matching schema."],
    };
  }

  const issues: string[] = [];
  const result: TenderAiMatchingContent = parsed.data;
  const returnedIds = result.matches.map((match) => match.tenderId);
  const expected = new Set(candidateIds);

  if (new Set(returnedIds).size !== returnedIds.length) {
    issues.push("A candidate tender appears more than once.");
  }

  const missingIds = candidateIds.filter((id) => !returnedIds.includes(id));
  const unknownIds = returnedIds.filter((id) => !expected.has(id));

  if (missingIds.length > 0) {
    issues.push(`Missing candidate tender IDs: ${missingIds.join(", ")}.`);
  }
  if (unknownIds.length > 0) {
    issues.push(`Unknown tender IDs returned: ${unknownIds.join(", ")}.`);
  }

  for (const match of result.matches) {
    const allText = [
      ...match.whyMatches,
      ...match.whyMayNotMatch,
      ...match.whatToCheckNext,
    ].join(" ");

    if (eligibilityOverclaimPattern.test(allText)) {
      issues.push(`Tender ${match.tenderId} contains an eligibility overclaim.`);
    }

    if (match.confidence === "HIGH" && match.whyMayNotMatch.length === 0) {
      issues.push(
        `Tender ${match.tenderId} has high confidence without any limitations.`,
      );
    }
  }

  return { passed: issues.length === 0, issues };
}
