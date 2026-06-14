import assert from "node:assert/strict";
import test from "node:test";

import { bookletAnalysisSchema } from "./booklet-analysis-schema";

function finding() {
  return {
    statement: "The booklet requires a technical proposal.",
    sourceType: "TENDER_SPECIFIC" as const,
    confidence: "HIGH" as const,
    citations: [
      { citationId: "p012-s001", pageNumber: 12, excerpt: "العرض الفني" },
    ],
  };
}

test("validates a cited booklet analysis", () => {
  const result = bookletAnalysisSchema.safeParse({
    executiveSummary: [finding()],
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
  });

  assert.equal(result.success, true);
});

test("rejects an uncited finding", () => {
  const result = bookletAnalysisSchema.safeParse({
    executiveSummary: [{ ...finding(), citations: [] }],
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
  });

  assert.equal(result.success, false);
});
