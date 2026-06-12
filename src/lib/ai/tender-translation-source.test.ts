import assert from "node:assert/strict";
import test from "node:test";

import {
  buildTenderTranslationSource,
  hashTenderTranslationSource,
} from "./tender-translation-source";

test("source hash changes only when translatable Arabic content changes", () => {
  const source = buildTenderTranslationSource({
    titleArabic: "عنوان",
    descriptionArabic: "وصف",
  });

  assert.equal(hashTenderTranslationSource(source), hashTenderTranslationSource(source));
  assert.notEqual(
    hashTenderTranslationSource(source),
    hashTenderTranslationSource({ ...source, descriptionArabic: "وصف جديد" }),
  );
});
