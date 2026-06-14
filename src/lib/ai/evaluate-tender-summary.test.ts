import assert from "node:assert/strict";
import test from "node:test";

import { evaluateTenderSummary } from "./evaluate-tender-summary";

function summary(overrides: Record<string, unknown> = {}) {
  return {
    summary: "This tender requests consulting services.",
    requirements: [],
    deadlineNotes: [],
    risks: [],
    fitNotes: [],
    questionsToAsk: [],
    nextActions: [],
    missingInformation: [],
    ...overrides,
  };
}

test("passes a grounded complete-tender summary", () => {
  const result = evaluateTenderSummary({
    content: summary(),
    detailEnrichmentStatus: "complete",
    submissionDeadline: new Date("2026-07-01T00:00:00.000Z"),
    hasCompanyProfile: false,
  });

  assert.equal(result.passed, true);
});

test("flags eligibility overclaims", () => {
  const result = evaluateTenderSummary({
    content: summary({ fitNotes: ["The company is eligible and likely to win."] }),
    detailEnrichmentStatus: "complete",
    submissionDeadline: new Date("2026-07-01T00:00:00.000Z"),
    hasCompanyProfile: true,
  });

  assert.equal(result.passed, false);
  assert.match(result.issues.join(" "), /overclaim/);
});

test("requires missing-data honesty for unenriched tenders", () => {
  const result = evaluateTenderSummary({
    content: summary(),
    detailEnrichmentStatus: "pending",
    submissionDeadline: null,
    hasCompanyProfile: false,
  });

  assert.equal(result.passed, false);
  assert.equal(result.issues.length, 2);
});

test("rejects fit notes without a company profile", () => {
  const result = evaluateTenderSummary({
    content: summary({ fitNotes: ["Relevant to consulting services."] }),
    detailEnrichmentStatus: "complete",
    submissionDeadline: new Date("2026-07-01T00:00:00.000Z"),
    hasCompanyProfile: false,
  });

  assert.equal(result.passed, false);
  assert.match(result.issues.join(" "), /without a company profile/);
});

test("rejects indirect fit notes and unsupported next actions", () => {
  const result = evaluateTenderSummary({
    content: summary({
      fitNotes: ["The company can help another bidder with registration."],
      nextActions: ["Contact the agency and prepare the bid submission."],
    }),
    detailEnrichmentStatus: "complete",
    submissionDeadline: new Date("2026-07-01T00:00:00.000Z"),
    hasCompanyProfile: true,
    hasDirectScopeMatch: false,
  });

  assert.equal(result.passed, false);
  assert.match(result.issues.join(" "), /without direct-scope evidence/);
  assert.match(result.issues.join(" "), /unsupported external/);
});
