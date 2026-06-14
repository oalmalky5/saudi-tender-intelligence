import assert from "node:assert/strict";
import test from "node:test";

import {
  assessOcrRequirement,
  isPdf,
  MIN_AVERAGE_PAGE_CHARACTERS,
} from "./extract-pdf";

test("validates the PDF file signature instead of trusting the filename", () => {
  assert.equal(isPdf(new TextEncoder().encode("%PDF-1.7")), true);
  assert.equal(isPdf(new TextEncoder().encode("not a pdf")), false);
});

test("flags sparse page extraction as requiring OCR", () => {
  assert.equal(
    assessOcrRequirement([
      { characterCount: 0 },
      { characterCount: MIN_AVERAGE_PAGE_CHARACTERS - 1 },
    ]),
    true,
  );
});

test("accepts sufficiently dense extracted text", () => {
  assert.equal(
    assessOcrRequirement([
      { characterCount: MIN_AVERAGE_PAGE_CHARACTERS },
      { characterCount: MIN_AVERAGE_PAGE_CHARACTERS },
    ]),
    false,
  );
});
