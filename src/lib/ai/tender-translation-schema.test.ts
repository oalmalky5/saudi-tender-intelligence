import assert from "node:assert/strict";
import test from "node:test";

import { tenderTranslationSchema } from "./tender-translation-schema";

test("accepts a translated title and nullable description", () => {
  assert.equal(
    tenderTranslationSchema.parse({
      titleEnglish: "Operation and maintenance services",
      descriptionEnglish: null,
    }).descriptionEnglish,
    null,
  );
});

test("rejects an empty translated title", () => {
  assert.equal(
    tenderTranslationSchema.safeParse({
      titleEnglish: "",
      descriptionEnglish: "Description",
    }).success,
    false,
  );
});
