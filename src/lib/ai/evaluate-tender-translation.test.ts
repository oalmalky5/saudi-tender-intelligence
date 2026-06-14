import assert from "node:assert/strict";
import test from "node:test";

import { evaluateTenderTranslation } from "./evaluate-tender-translation";

test("passes a structurally valid translation that preserves source numbers", () => {
  const evaluation = evaluateTenderTranslation(
    { titleArabic: "مشروع 2026", descriptionArabic: null },
    { titleEnglish: "Project 2026", descriptionEnglish: null },
  );

  assert.equal(evaluation.passed, true);
});

test("flags invented descriptions and missing source numbers", () => {
  const evaluation = evaluateTenderTranslation(
    { titleArabic: "مشروع 2026", descriptionArabic: null },
    { titleEnglish: "Project", descriptionEnglish: "Invented detail" },
  );

  assert.equal(evaluation.passed, false);
  assert.deepEqual(evaluation.issues, [
    "A description was invented when the source description was null.",
    "Source number 2026 is missing from the translation.",
  ]);
});

test("accepts an unchanged title when the Etimad source is already English", () => {
  const evaluation = evaluateTenderTranslation(
    { titleArabic: "LAUNDRY LIQUID DETERGENT", descriptionArabic: null },
    { titleEnglish: "LAUNDRY LIQUID DETERGENT", descriptionEnglish: null },
  );

  assert.equal(evaluation.passed, true);
});
