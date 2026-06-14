import assert from "node:assert/strict";
import test from "node:test";

import { evaluateWeeklyTenderReport } from "./evaluate-weekly-report";

const report = {
  executiveSummary: "One opportunity deserves review.",
  marketSignals: ["Innovation demand is visible."],
  recommendedActions: ["Review the public tender details."],
  limitations: ["Booklet requirements are unavailable."],
  tenderReviews: [
    {
      tenderId: "tender-1",
      categories: ["TOP_RELEVANT"],
      relevanceScore: 80,
      rationale: "The scope matches the company profile.",
      risks: ["Public details may be incomplete."],
      recommendedAction: "Review requirements and deadline.",
    },
  ],
};

test("accepts a grounded weekly report", () => {
  assert.equal(evaluateWeeklyTenderReport(["tender-1"], report).passed, true);
});

test("accepts an honest report with no credible tender matches", () => {
  const evaluation = evaluateWeeklyTenderReport(["tender-1"], {
    ...report,
    executiveSummary: "No credible direct-scope matches were found.",
    tenderReviews: [],
  });

  assert.equal(evaluation.passed, true);
});

test("rejects unknown tender IDs and eligibility overclaims", () => {
  const evaluation = evaluateWeeklyTenderReport(["tender-1"], {
    ...report,
    executiveSummary: "The company is eligible.",
    tenderReviews: [{ ...report.tenderReviews[0], tenderId: "unknown" }],
  });

  assert.equal(evaluation.passed, false);
  assert.match(evaluation.issues.join(" "), /Unknown tender IDs/);
  assert.match(evaluation.issues.join(" "), /overclaim/);
});
