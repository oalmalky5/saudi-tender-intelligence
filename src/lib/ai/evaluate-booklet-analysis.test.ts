import assert from "node:assert/strict";
import test from "node:test";

import {
  evaluateBookletAnalysis,
  sanitizeBookletAnalysis,
} from "./evaluate-booklet-analysis";

function content(
  excerpt: string,
  statement = "A technical proposal is required.",
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

test("passes when citation excerpts exist on supplied pages", () => {
  const result = evaluateBookletAnalysis(
    [{ pageNumber: 1, text: "يجب تقديم العرض الفني" }],
    content("يجب تقديم العرض الفني"),
  );

  assert.equal(result.passed, true);
});

test("rejects unknown citation IDs", () => {
  const result = evaluateBookletAnalysis(
    [{ pageNumber: 1, text: "نص مختلف" }],
    content("نص مختلف", undefined, "p001-s999"),
  );

  assert.equal(result.passed, false);
  assert.match(result.issues.join(" "), /unknown ID/);
});

test("rejects citation content that does not match its trusted ID", () => {
  const result = evaluateBookletAnalysis(
    [{ pageNumber: 1, text: "يجب تقديم العرض الفني" }],
    content("العرض الفني"),
  );

  assert.equal(result.passed, false);
  assert.match(result.issues.join(" "), /does not match its trusted source/);
});

test("rejects company eligibility overclaims", () => {
  const result = evaluateBookletAnalysis(
    [{ pageNumber: 1, text: "العرض الفني" }],
    content("العرض الفني", "The company is eligible for this tender."),
  );

  assert.equal(result.passed, false);
  assert.match(result.issues.join(" "), /overclaim/);
});

test("allows general bidder eligibility requirements", () => {
  const result = evaluateBookletAnalysis(
    [{ pageNumber: 1, text: "شروط أهلية المتنافسين" }],
    content(
      "شروط أهلية المتنافسين",
      "Bidders must satisfy the stated general eligibility requirements.",
    ),
  );

  assert.equal(result.passed, true);
});

test("rejects indirect bidder-support services as company fit", () => {
  const result = evaluateBookletAnalysis(
    [{ pageNumber: 1, text: "يجب تقديم العرض الفني" }],
    {
      ...content("يجب تقديم العرض الفني"),
      executiveSummary: [],
      companyFitNotes: [
        {
          statement: "Catalyft can provide Etimad registration and bid readiness.",
          sourceType: "TENDER_SPECIFIC",
          confidence: "HIGH",
          citations: [
            {
              citationId: "p001-s001",
              pageNumber: 1,
              excerpt: "يجب تقديم العرض الفني",
            },
          ],
        },
      ],
    },
  );

  assert.equal(result.passed, false);
  assert.match(result.issues.join(" "), /indirect bidder support/);
});

test("sanitizes indirect bidder-support fit while preserving direct-scope fit", () => {
  const directFinding = {
    statement: "The company directly delivers innovation-center operating models.",
    sourceType: "TENDER_SPECIFIC" as const,
    confidence: "HIGH" as const,
    citations: [
      {
        citationId: "p001-s001",
        pageNumber: 1,
        excerpt: "يجب تقديم العرض الفني",
      },
    ],
  };
  const unsafeFinding = {
    ...directFinding,
    statement: "The company can provide Etimad registration support.",
  };

  const sanitized = sanitizeBookletAnalysis({
    ...content("يجب تقديم العرض الفني"),
    companyFitNotes: [unsafeFinding, directFinding],
  });

  assert.deepEqual(sanitized.companyFitNotes, [directFinding]);
});
