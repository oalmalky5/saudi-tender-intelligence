import assert from "node:assert/strict";
import test from "node:test";

import { tenderChatAnswerSchema } from "./tender-chat-schema";

test("validates a grounded tender database answer", () => {
  const result = tenderChatAnswerSchema.safeParse({
    answer: "Tender 1 closes this week.",
    unsupported: false,
    caveats: [],
    citations: [{ tenderId: "one", claim: "Closes this week." }],
  });

  assert.equal(result.success, true);
});

test("rejects an empty answer", () => {
  const result = tenderChatAnswerSchema.safeParse({
    answer: "",
    unsupported: true,
    caveats: [],
    citations: [],
  });

  assert.equal(result.success, false);
});
