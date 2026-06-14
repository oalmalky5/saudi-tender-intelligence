import assert from "node:assert/strict";
import test from "node:test";

import { evaluateTenderMatching } from "./evaluate-tender-matching";

function match(tenderId: string) {
  return {
    tenderId,
    relevanceScore: 70,
    whyMatches: ["Relevant service scope."],
    whyMayNotMatch: ["Full requirements are unavailable."],
    whatToCheckNext: ["Review detailed requirements."],
    recommendedAction: "REVIEW" as const,
    confidence: "MEDIUM" as const,
  };
}

test("passes when every candidate is ranked exactly once", () => {
  const result = evaluateTenderMatching(["one", "two"], {
    matches: [match("one"), match("two")],
  });

  assert.equal(result.passed, true);
});

test("flags missing, unknown, and duplicated candidates", () => {
  const result = evaluateTenderMatching(["one", "two"], {
    matches: [match("one"), match("one"), match("three")],
  });

  assert.equal(result.passed, false);
  assert.match(result.issues.join(" "), /more than once/);
  assert.match(result.issues.join(" "), /Missing candidate tender IDs: two/);
  assert.match(result.issues.join(" "), /Unknown tender IDs returned: three/);
});

test("flags eligibility overclaims", () => {
  const result = evaluateTenderMatching(["one"], {
    matches: [
      {
        ...match("one"),
        whyMatches: ["The company is qualified to bid."],
      },
    ],
  });

  assert.equal(result.passed, false);
  assert.match(result.issues.join(" "), /overclaim/);
});

test("allows eligibility to be presented as something to verify", () => {
  const result = evaluateTenderMatching(["one"], {
    matches: [
      {
        ...match("one"),
        whatToCheckNext: ["Confirm whether the company is eligible to participate."],
      },
    ],
  });

  assert.equal(result.passed, true);
});

test("rejects indirect bidder-support reasoning as a company match", () => {
  const result = evaluateTenderMatching(
    ["one"],
    {
      matches: [
        {
          ...match("one"),
          relevanceScore: 10,
          whyMatches: ["The supplier may need onboarding support."],
          recommendedAction: "IGNORE",
        },
      ],
    },
    new Map([["one", false]]),
  );

  assert.equal(result.passed, false);
  assert.match(result.issues.join(" "), /without direct-scope evidence/);
});
