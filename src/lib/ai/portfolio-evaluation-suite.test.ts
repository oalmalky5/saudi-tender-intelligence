import assert from "node:assert/strict";
import test from "node:test";

import {
  portfolioEvaluationSummary,
  runPortfolioEvaluationSuite,
} from "./portfolio-evaluation-suite";

test("portfolio AI guardrails accept valid outputs and reject adversarial outputs", () => {
  const results = runPortfolioEvaluationSuite();
  const summary = portfolioEvaluationSummary(results);

  assert.equal(summary.scenarios, 16);
  assert.equal(summary.passed, 16);
  assert.equal(summary.failed, 0);
  assert.equal(summary.acceptedAsExpected, 7);
  assert.equal(summary.rejectedAsExpected, 9);
});
