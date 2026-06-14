import assert from "node:assert/strict";
import test from "node:test";

import { evaluateTenderChatAnswer } from "./evaluate-tender-chat";

test("passes a supported answer citing a retrieved tender", () => {
  const result = evaluateTenderChatAnswer(["one"], {
    answer: "The retrieved tender closes this week.",
    unsupported: false,
    caveats: [],
    citations: [{ tenderId: "one", claim: "Closes this week." }],
  });

  assert.equal(result.passed, true);
});

test("requires refusal when retrieval is empty", () => {
  const result = evaluateTenderChatAnswer([], {
    answer: "A tender exists.",
    unsupported: false,
    caveats: [],
    citations: [],
  });

  assert.equal(result.passed, false);
  assert.match(result.issues.join(" "), /no tenders were retrieved/);
});

test("rejects citations outside retrieval", () => {
  const result = evaluateTenderChatAnswer(["one"], {
    answer: "Tender two is relevant.",
    unsupported: false,
    caveats: [],
    citations: [{ tenderId: "two", claim: "Relevant." }],
  });

  assert.equal(result.passed, false);
  assert.match(result.issues.join(" "), /unretrieved tender two/);
});

test("rejects internal tender IDs in answer prose", () => {
  const result = evaluateTenderChatAnswer(["internal-id"], {
    answer: "Tender internal-id closes this week.",
    unsupported: false,
    caveats: [],
    citations: [{ tenderId: "internal-id", claim: "Closes this week." }],
  });

  assert.equal(result.passed, false);
  assert.match(result.issues.join(" "), /exposes internal tender ID/);
});
