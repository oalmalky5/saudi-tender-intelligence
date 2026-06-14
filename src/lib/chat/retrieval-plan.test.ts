import assert from "node:assert/strict";
import test from "node:test";

import { buildTenderChatRetrievalPlan } from "./retrieval-plan";

test("detects closing-this-week questions", () => {
  const plan = buildTenderChatRetrievalPlan(
    "What tenders are closing this week?",
  );

  assert.equal(plan.mode, "closing_soon");
  assert.equal(plan.daysUntilDeadline, 7);
});

test("detects company-fit questions", () => {
  const plan = buildTenderChatRetrievalPlan(
    "Which tenders are relevant to our company profile?",
  );

  assert.equal(plan.mode, "company_fit");
  assert.equal(plan.requiresCompanyProfile, true);
});

test("extracts tender reference numbers", () => {
  const plan = buildTenderChatRetrievalPlan(
    "Compare 260639003513 and 260639003759",
  );

  assert.equal(plan.mode, "reference");
  assert.deepEqual(plan.referenceNumbers, ["260639003513", "260639003759"]);
});

test("uses meaningful keyword terms", () => {
  const plan = buildTenderChatRetrievalPlan("Show ICT tenders in Riyadh");

  assert.equal(plan.mode, "keyword");
  assert.deepEqual(plan.queryTerms, ["ict", "riyadh"]);
});
