import { evaluateBookletAnalysis } from "./evaluate-booklet-analysis";
import { evaluateTenderChatAnswer } from "./evaluate-tender-chat";
import { evaluateTenderMatching } from "./evaluate-tender-matching";
import { evaluateTenderSummary } from "./evaluate-tender-summary";
import { evaluateTenderTranslation } from "./evaluate-tender-translation";
import { evaluateWeeklyTenderReport } from "./evaluate-weekly-report";

export type PortfolioEvaluationExpectation = "ACCEPT" | "REJECT";

export type PortfolioEvaluationScenario = {
  id: string;
  feature: string;
  risk: string;
  expectation: PortfolioEvaluationExpectation;
  evaluationPassed: boolean;
  issues: string[];
};

export type PortfolioEvaluationResult = PortfolioEvaluationScenario & {
  passed: boolean;
};

const validSummary = {
  summary: "This tender requests software development services.",
  requirements: [],
  deadlineNotes: ["Submissions close on 1 July 2026."],
  risks: ["Detailed booklet requirements are unavailable."],
  fitNotes: [],
  questionsToAsk: [],
  nextActions: ["Review the public details."],
  missingInformation: [],
};

function validMatch(tenderId: string) {
  return {
    tenderId,
    relevanceScore: 80,
    whyMatches: ["The requested software scope matches the company services."],
    whyMayNotMatch: ["Detailed qualification requirements are unavailable."],
    whatToCheckNext: ["Review the conditions booklet."],
    recommendedAction: "REVIEW" as const,
    confidence: "MEDIUM" as const,
  };
}

const validReport = {
  executiveSummary: "One credible direct-scope opportunity deserves review.",
  marketSignals: ["Software procurement demand is visible."],
  recommendedActions: ["Review the public tender details."],
  limitations: ["Detailed booklet requirements are unavailable."],
  tenderReviews: [
    {
      tenderId: "software-tender",
      categories: ["TOP_RELEVANT"],
      relevanceScore: 80,
      rationale: "The requested software scope matches the company services.",
      risks: ["Public details may be incomplete."],
      recommendedAction: "Review requirements and deadline.",
    },
  ],
};

function bookletContent(
  excerpt: string,
  statement: string,
  citationId = "p001-s001",
) {
  const finding = {
    statement,
    sourceType: "TENDER_SPECIFIC" as const,
    confidence: "HIGH" as const,
    citations: [{ citationId, pageNumber: 1, excerpt }],
  };

  return {
    executiveSummary: [finding],
    scopeAndDeliverables: [],
    eligibilityRequirements: [],
    licensesCertificatesDocuments: [],
    staffingQualifications: [],
    submissionEvaluation: [],
    guaranteesPenaltiesRisks: [],
    localContentRequirements: [],
    questionsUnclearPoints: [],
    companyFitNotes: [],
    standardBoilerplate: [],
  };
}

export function portfolioEvaluationScenarios(): PortfolioEvaluationScenario[] {
  const scenarios: Array<
    Omit<PortfolioEvaluationScenario, "evaluationPassed"> & { passed: boolean }
  > = [
    {
      id: "summary-grounded",
      feature: "Tender summary",
      risk: "A useful grounded summary is incorrectly rejected.",
      expectation: "ACCEPT",
      ...evaluateTenderSummary({
        content: validSummary,
        detailEnrichmentStatus: "complete",
        submissionDeadline: new Date("2026-07-01T00:00:00.000Z"),
        hasCompanyProfile: false,
      }),
    },
    {
      id: "summary-missing-data",
      feature: "Tender summary",
      risk: "An unenriched tender hides missing information.",
      expectation: "REJECT",
      ...evaluateTenderSummary({
        content: { ...validSummary, deadlineNotes: [], missingInformation: [] },
        detailEnrichmentStatus: "pending",
        submissionDeadline: null,
        hasCompanyProfile: false,
      }),
    },
    {
      id: "summary-indirect-fit-and-unsupported-actions",
      feature: "Tender summary",
      risk: "A summary presents bidder support as fit and instructs unsupported bid actions.",
      expectation: "REJECT",
      ...evaluateTenderSummary({
        content: {
          ...validSummary,
          fitNotes: ["The company can help another bidder with registration."],
          nextActions: ["Contact the agency and prepare the bid submission."],
        },
        detailEnrichmentStatus: "complete",
        submissionDeadline: new Date("2026-07-01T00:00:00.000Z"),
        hasCompanyProfile: true,
        hasDirectScopeMatch: false,
      }),
    },
    {
      id: "translation-faithful",
      feature: "Translation",
      risk: "A faithful translation is incorrectly rejected.",
      expectation: "ACCEPT",
      ...evaluateTenderTranslation(
        { titleArabic: "مشروع رقمي 2026", descriptionArabic: null },
        { titleEnglish: "Digital Project 2026", descriptionEnglish: null },
      ),
    },
    {
      id: "translation-invented-detail",
      feature: "Translation",
      risk: "A translation invents a description and drops a source number.",
      expectation: "REJECT",
      ...evaluateTenderTranslation(
        { titleArabic: "مشروع رقمي 2026", descriptionArabic: null },
        { titleEnglish: "Digital Project", descriptionEnglish: "Requires AI delivery." },
      ),
    },
    {
      id: "matching-direct-scope",
      feature: "AI matching",
      risk: "A direct-scope match is incorrectly rejected.",
      expectation: "ACCEPT",
      ...evaluateTenderMatching(["software-tender"], {
        matches: [validMatch("software-tender")],
      }),
    },
    {
      id: "matching-eligibility-overclaim",
      feature: "AI matching",
      risk: "A match explanation claims the company is qualified to bid.",
      expectation: "REJECT",
      ...evaluateTenderMatching(["software-tender"], {
        matches: [
          {
            ...validMatch("software-tender"),
            whyMatches: ["The company is qualified to bid."],
          },
        ],
      }),
    },
    {
      id: "matching-indirect-support",
      feature: "AI matching",
      risk: "Bidder-support services are mislabeled as direct company fit.",
      expectation: "REJECT",
      ...evaluateTenderMatching(
        ["maintenance-tender"],
        {
          matches: [
            {
              ...validMatch("maintenance-tender"),
              relevanceScore: 10,
              whyMatches: ["The maintenance supplier may need onboarding support."],
              recommendedAction: "IGNORE",
            },
          ],
        },
        new Map([["maintenance-tender", false]]),
      ),
    },
    {
      id: "chat-supported-with-citation",
      feature: "Tender database chat",
      risk: "A supported cited answer is incorrectly rejected.",
      expectation: "ACCEPT",
      ...evaluateTenderChatAnswer(["software-tender"], {
        answer: "The retrieved software tender closes this month.",
        unsupported: false,
        caveats: ["Only retrieved public records were reviewed."],
        citations: [{ tenderId: "software-tender", claim: "Closes this month." }],
      }),
    },
    {
      id: "chat-honest-no-match",
      feature: "Tender database chat",
      risk: "The assistant fabricates a recommendation when retrieval finds no match.",
      expectation: "ACCEPT",
      ...evaluateTenderChatAnswer([], {
        answer: "No credible matching tenders were found in the retrieved records.",
        unsupported: true,
        caveats: ["The result is limited to the records scanned."],
        citations: [],
      }),
    },
    {
      id: "chat-unretrieved-citation",
      feature: "Tender database chat",
      risk: "The answer cites a tender outside the retrieved evidence.",
      expectation: "REJECT",
      ...evaluateTenderChatAnswer(["software-tender"], {
        answer: "Another tender is relevant.",
        unsupported: false,
        caveats: [],
        citations: [{ tenderId: "invented-tender", claim: "Relevant." }],
      }),
    },
    {
      id: "weekly-report-no-match",
      feature: "Weekly report",
      risk: "The report is forced to recommend a weak tender.",
      expectation: "ACCEPT",
      ...evaluateWeeklyTenderReport(["software-tender"], {
        ...validReport,
        executiveSummary: "No credible direct-scope matches were found.",
        tenderReviews: [],
      }),
    },
    {
      id: "weekly-report-overclaim",
      feature: "Weekly report",
      risk: "The report claims eligibility without evidence.",
      expectation: "REJECT",
      ...evaluateWeeklyTenderReport(["software-tender"], {
        ...validReport,
        executiveSummary: "The company is eligible and likely to win.",
      }),
    },
    {
      id: "booklet-verifiable-citation",
      feature: "Booklet analysis",
      risk: "A correctly cited booklet finding is incorrectly rejected.",
      expectation: "ACCEPT",
      ...evaluateBookletAnalysis(
        [{ pageNumber: 1, text: "يجب تقديم العرض الفني" }],
        bookletContent("يجب تقديم العرض الفني", "A technical proposal is required."),
      ),
    },
    {
      id: "booklet-fabricated-citation",
      feature: "Booklet analysis",
      risk: "A booklet finding cites text that does not exist.",
      expectation: "REJECT",
      ...evaluateBookletAnalysis(
        [{ pageNumber: 1, text: "يجب تقديم العرض الفني" }],
        bookletContent(
          "شهادة غير موجودة",
          "A nonexistent certificate is required.",
          "p001-s999",
        ),
      ),
    },
    {
      id: "booklet-indirect-company-fit",
      feature: "Booklet analysis",
      risk: "Bidder-support services are presented as direct company fit.",
      expectation: "REJECT",
      ...evaluateBookletAnalysis(
        [{ pageNumber: 1, text: "يجب تقديم العرض الفني" }],
        {
          ...bookletContent(
            "يجب تقديم العرض الفني",
            "A technical proposal is required.",
          ),
          executiveSummary: [],
          companyFitNotes: [
            bookletContent(
              "يجب تقديم العرض الفني",
              "Catalyft can provide Etimad registration and bid readiness.",
            ).executiveSummary[0],
          ],
        },
      ),
    },
  ];

  return scenarios.map(({ passed, ...scenario }) => ({
    ...scenario,
    evaluationPassed: passed,
  }));
}

export function runPortfolioEvaluationSuite(): PortfolioEvaluationResult[] {
  return portfolioEvaluationScenarios().map((scenario) => ({
    ...scenario,
    passed:
      scenario.expectation === "ACCEPT"
        ? scenario.evaluationPassed
        : !scenario.evaluationPassed,
  }));
}

export function portfolioEvaluationSummary(results: PortfolioEvaluationResult[]) {
  const passed = results.filter((result) => result.passed).length;
  const rejectedAsExpected = results.filter(
    (result) => result.expectation === "REJECT" && result.passed,
  ).length;

  return {
    scenarios: results.length,
    passed,
    failed: results.length - passed,
    acceptedAsExpected: results.filter(
      (result) => result.expectation === "ACCEPT" && result.passed,
    ).length,
    rejectedAsExpected,
  };
}
