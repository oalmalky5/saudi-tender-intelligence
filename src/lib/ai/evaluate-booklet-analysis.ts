import {
  bookletAnalysisSchema,
  type BookletAnalysisContent,
  type BookletFinding,
} from "./booklet-analysis-schema";
import { buildBookletCitationCatalog } from "./booklet-analysis-context";

export type BookletAnalysisEvaluation = {
  passed: boolean;
  issues: string[];
};

const companyComplianceOverclaim =
  /\b(company (?:meets|satisfies|is eligible|is qualified)|the company (?:meets|satisfies|is eligible|is qualified)|eligibility confirmed for the company|company is fully compliant)\b/i;
const indirectCompanyFit =
  /\b(registration|supplier onboarding|etimad|portal|compliance paperwork|submission support|tender readiness|bid readiness)\b/i;

function normalize(value: string): string {
  return value.toLocaleLowerCase().replace(/\s+/g, " ").trim();
}

function allFindings(content: BookletAnalysisContent): BookletFinding[] {
  return Object.values(content).flat();
}

export function sanitizeBookletAnalysis(
  content: BookletAnalysisContent,
): BookletAnalysisContent {
  return {
    ...content,
    companyFitNotes: content.companyFitNotes.filter(
      (finding) => !indirectCompanyFit.test(finding.statement),
    ),
  };
}

export function evaluateBookletAnalysis(
  pages: Array<{ pageNumber: number; text: string }>,
  content: unknown,
): BookletAnalysisEvaluation {
  const parsed = bookletAnalysisSchema.safeParse(content);
  if (!parsed.success) {
    return {
      passed: false,
      issues: ["Output does not match the booklet-analysis schema."],
    };
  }

  const issues: string[] = [];
  const citationById = new Map(
    buildBookletCitationCatalog(pages).map((citation) => [
      citation.citationId,
      citation,
    ]),
  );

  for (const finding of allFindings(parsed.data)) {
    if (companyComplianceOverclaim.test(finding.statement)) {
      issues.push(`Finding contains a company compliance overclaim: ${finding.statement}`);
    }

    for (const citation of finding.citations) {
      const trustedCitation = citationById.get(citation.citationId);
      if (!trustedCitation) {
        issues.push(`Citation references unknown ID ${citation.citationId}.`);
        continue;
      }
      if (
        citation.pageNumber !== trustedCitation.pageNumber ||
        normalize(citation.excerpt) !== normalize(trustedCitation.excerpt)
      ) {
        issues.push(`Citation ${citation.citationId} does not match its trusted source.`);
      }
    }
  }

  for (const finding of parsed.data.companyFitNotes) {
    if (indirectCompanyFit.test(finding.statement)) {
      issues.push(`Company-fit note relies on indirect bidder support: ${finding.statement}`);
    }
  }

  return { passed: issues.length === 0, issues };
}
