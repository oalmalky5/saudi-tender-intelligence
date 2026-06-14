import { weeklyTenderReportSchema } from "./weekly-report-schema";

const overclaimPattern =
  /\b(eligible|eligibility confirmed|guaranteed|likely to win|will win|qualified to bid)\b/i;

export function evaluateWeeklyTenderReport(
  candidateIds: string[],
  content: unknown,
): { passed: boolean; issues: string[] } {
  const parsed = weeklyTenderReportSchema.safeParse(content);
  if (!parsed.success) {
    return { passed: false, issues: ["Output does not match the weekly report schema."] };
  }

  const issues: string[] = [];
  const expected = new Set(candidateIds);
  const reviews = parsed.data.tenderReviews;
  const returnedIds = reviews.map((review) => review.tenderId);

  if (new Set(returnedIds).size !== returnedIds.length) {
    issues.push("A tender appears more than once in the report.");
  }
  const unknown = returnedIds.filter((id) => !expected.has(id));
  if (unknown.length > 0) {
    issues.push(`Unknown tender IDs returned: ${unknown.join(", ")}.`);
  }
  const text = [
    parsed.data.executiveSummary,
    ...parsed.data.marketSignals,
    ...parsed.data.recommendedActions,
    ...parsed.data.limitations,
    ...reviews.flatMap((review) => [
      review.rationale,
      review.recommendedAction,
      ...review.risks,
    ]),
  ].join(" ");
  if (overclaimPattern.test(text)) {
    issues.push("Report contains an eligibility or winning-probability overclaim.");
  }

  return { passed: issues.length === 0, issues };
}
