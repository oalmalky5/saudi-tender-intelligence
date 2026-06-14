import {
  tenderAiSummarySchema,
  type TenderAiSummaryContent,
} from "./tender-summary-schema";

export type TenderSummaryEvaluationInput = {
  content: unknown;
  detailEnrichmentStatus: string;
  submissionDeadline: Date | null;
  hasCompanyProfile: boolean;
  hasDirectScopeMatch?: boolean;
};

export type TenderSummaryEvaluation = {
  passed: boolean;
  issues: string[];
};

const eligibilityOverclaimPattern =
  /\b(eligible|eligibility confirmed|guaranteed|likely to win|will win|qualified to bid)\b/i;
const unsupportedActionPattern =
  /\b(contact|request|download|purchase|pay|obtain|prepare|clarify|confirm|verify)\b/i;

function allSummaryText(content: TenderAiSummaryContent): string {
  return [
    content.summary,
    ...content.requirements,
    ...content.deadlineNotes,
    ...content.risks,
    ...content.fitNotes,
    ...content.questionsToAsk,
    ...content.nextActions,
    ...content.missingInformation,
  ].join(" ");
}

export function evaluateTenderSummary(
  input: TenderSummaryEvaluationInput,
): TenderSummaryEvaluation {
  const parsed = tenderAiSummarySchema.safeParse(input.content);

  if (!parsed.success) {
    return { passed: false, issues: ["Output does not match the summary schema."] };
  }

  const issues: string[] = [];
  const content = parsed.data;

  if (eligibilityOverclaimPattern.test(allSummaryText(content))) {
    issues.push("Output contains an eligibility or winning-probability overclaim.");
  }

  if (!input.hasCompanyProfile && content.fitNotes.length > 0) {
    issues.push("Fit notes were generated without a company profile.");
  }

  if (input.hasDirectScopeMatch === false && content.fitNotes.length > 0) {
    issues.push("Fit notes were generated without direct-scope evidence.");
  }

  if (content.nextActions.some((action) => unsupportedActionPattern.test(action))) {
    issues.push("Next actions contain unsupported external or bid-preparation instructions.");
  }

  if (
    input.detailEnrichmentStatus !== "complete" &&
    content.missingInformation.length === 0
  ) {
    issues.push("Unenriched tender does not acknowledge missing information.");
  }

  if (
    input.submissionDeadline === null &&
    !content.missingInformation.some((item) => /deadline|submission/i.test(item))
  ) {
    issues.push("Missing submission deadline is not acknowledged.");
  }

  return { passed: issues.length === 0, issues };
}
