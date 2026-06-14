import assert from "node:assert/strict";
import test from "node:test";

import {
  rateLimitRetrySeconds,
  rateLimitWindowStart,
} from "./rate-limit";

test("rateLimitWindowStart aligns requests to a fixed window", () => {
  assert.equal(
    rateLimitWindowStart(new Date("2026-06-14T12:34:56.000Z"), 60 * 60).toISOString(),
    "2026-06-14T12:00:00.000Z",
  );
});

test("rateLimitRetrySeconds reports time remaining in the window", () => {
  assert.equal(
    rateLimitRetrySeconds(
      new Date("2026-06-14T12:59:30.000Z"),
      new Date("2026-06-14T12:00:00.000Z"),
      60 * 60,
    ),
    30,
  );
});
