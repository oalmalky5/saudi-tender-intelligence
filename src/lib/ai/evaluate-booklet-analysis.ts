import {
  bookletAnalysisSchema,
  type BookletAnalysisContent,
  type BookletFinding,
} from "./booklet-analysis-schema";

export type BookletAnalysisEvaluation = {
  passed: boolean;
  issues: string[];
};

const companyComplianceOverclaim =
  /\b(company (?:meets|satisfies)|eligible|eligibility confirmed|qualified to bid|fully compliant)\b/i;

function normalize(value: string): string {
  return value.toLocaleLowerCase().replace(/\s+/g, " ").trim();
}

function allFindings(content: BookletAnalysisContent): BookletFinding[] {
  return Object.values(content).flat();
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
  const pageByNumber = new Map(
    pages.map((page) => [page.pageNumber, normalize(page.text)]),
  );

  for (const finding of allFindings(parsed.data)) {
    if (companyComplianceOverclaim.test(finding.statement)) {
      issues.push(`Finding contains a company compliance overclaim: ${finding.statement}`);
    }

    for (const citation of finding.citations) {
      const pageText = pageByNumber.get(citation.pageNumber);
      if (!pageText) {
        issues.push(`Citation references unavailable page ${citation.pageNumber}.`);
        continue;
      }
      if (!pageText.includes(normalize(citation.excerpt))) {
        issues.push(
          `Citation excerpt was not found verbatim on page ${citation.pageNumber}.`,
        );
      }
    }
  }

  return { passed: issues.length === 0, issues };
}
