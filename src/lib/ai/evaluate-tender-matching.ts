import {
  tenderAiMatchingSchema,
  type TenderAiMatchingContent,
} from "./tender-matching-schema";

export type TenderMatchingEvaluation = {
  passed: boolean;
  issues: string[];
};

const eligibilityOverclaimPattern =
  /\b(company is eligible|eligible to bid|eligibility (?:is )?confirmed|guaranteed|likely to win|will win|qualified to bid)\b/i;
const eligibilityVerificationPattern =
  /\b(confirm|check|verify|determine|whether|if)\b.{0,80}\b(company is eligible|eligible to bid|qualified to bid)\b/i;

function containsEligibilityOverclaim(text: string): boolean {
  return (
    eligibilityOverclaimPattern.test(text) &&
    !eligibilityVerificationPattern.test(text)
  );
}

export function evaluateTenderMatching(
  candidateIds: string[],
  content: unknown,
  directScopeByTenderId?: ReadonlyMap<string, boolean>,
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
    const explanationItems = [
      ...match.whyMatches,
      ...match.whyMayNotMatch,
      ...match.whatToCheckNext,
    ];

    if (explanationItems.some(containsEligibilityOverclaim)) {
      issues.push(`Tender ${match.tenderId} contains an eligibility overclaim.`);
    }

    if (match.confidence === "HIGH" && match.whyMayNotMatch.length === 0) {
      issues.push(
        `Tender ${match.tenderId} has high confidence without any limitations.`,
      );
    }

    if (
      directScopeByTenderId?.get(match.tenderId) === false &&
      (match.whyMatches.length > 0 ||
        match.relevanceScore > 10 ||
        match.recommendedAction !== "IGNORE")
    ) {
      issues.push(
        `Tender ${match.tenderId} presents relevance without direct-scope evidence.`,
      );
    }
  }

  return { passed: issues.length === 0, issues };
}
