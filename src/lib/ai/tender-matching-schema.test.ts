import assert from "node:assert/strict";
import test from "node:test";

import { tenderAiMatchingSchema } from "./tender-matching-schema";

test("validates a bounded AI tender match", () => {
  const result = tenderAiMatchingSchema.safeParse({
    matches: [
      {
        tenderId: "tender-1",
        relevanceScore: 82,
        whyMatches: ["The scope aligns with strategy consulting."],
        whyMayNotMatch: ["Detailed qualification criteria are unavailable."],
        whatToCheckNext: ["Review the conditions booklet."],
        recommendedAction: "REVIEW",
        confidence: "HIGH",
      },
    ],
  });

  assert.equal(result.success, true);
});

test("rejects a relevance score above 100", () => {
  const result = tenderAiMatchingSchema.safeParse({
    matches: [
      {
        tenderId: "tender-1",
        relevanceScore: 101,
        whyMatches: [],
        whyMayNotMatch: [],
        whatToCheckNext: [],
        recommendedAction: "REVIEW",
        confidence: "LOW",
      },
    ],
  });

  assert.equal(result.success, false);
});
