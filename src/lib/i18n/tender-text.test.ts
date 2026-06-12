import assert from "node:assert/strict";
import test from "node:test";

import { localizedTenderText } from "./tender-text";

test("prefers English tender text in the English interface", () => {
  assert.deepEqual(localizedTenderText("en", "English title", "عنوان عربي"), {
    value: "English title",
    language: "en",
    direction: "ltr",
  });
});

test("falls back to Arabic tender text with RTL direction", () => {
  assert.deepEqual(localizedTenderText("en", null, "عنوان عربي"), {
    value: "عنوان عربي",
    language: "ar",
    direction: "rtl",
  });
  assert.equal(localizedTenderText("ar", "English title", "عنوان عربي").value, "عنوان عربي");
});
