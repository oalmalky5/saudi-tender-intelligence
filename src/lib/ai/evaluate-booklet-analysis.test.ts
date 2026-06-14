import assert from "node:assert/strict";
import test from "node:test";

import { evaluateBookletAnalysis } from "./evaluate-booklet-analysis";

function content(excerpt: string, statement = "A technical proposal is required.") {
  const finding = {
    statement,
    sourceType: "TENDER_SPECIFIC" as const,
    confidence: "HIGH" as const,
    citations: [{ pageNumber: 1, excerpt }],
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
    content("العرض الفني"),
  );

  assert.equal(result.passed, true);
});

test("rejects citations that cannot be verified", () => {
  const result = evaluateBookletAnalysis(
    [{ pageNumber: 1, text: "نص مختلف" }],
    content("العرض الفني"),
  );

  assert.equal(result.passed, false);
  assert.match(result.issues.join(" "), /not found verbatim/);
});

test("rejects company eligibility overclaims", () => {
  const result = evaluateBookletAnalysis(
    [{ pageNumber: 1, text: "العرض الفني" }],
    content("العرض الفني", "The company is eligible for this tender."),
  );

  assert.equal(result.passed, false);
  assert.match(result.issues.join(" "), /overclaim/);
});
