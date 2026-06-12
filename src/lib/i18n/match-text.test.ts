import assert from "node:assert/strict";
import test from "node:test";

import { localizeMatchText } from "./match-text";

test("localizes deterministic matching explanations", () => {
  assert.equal(
    localizeMatchText("Activity matches: consulting", "ar"),
    "تطابق النشاط: consulting",
  );
  assert.equal(
    localizeMatchText("Submission deadline has passed.", "ar"),
    "انتهى آخر موعد للتقديم.",
  );
  assert.equal(
    localizeMatchText("Submission deadline has passed.", "en"),
    "Submission deadline has passed.",
  );
});
