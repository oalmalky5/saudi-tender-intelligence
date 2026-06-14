import assert from "node:assert/strict";
import test from "node:test";

import { localizedMetadata } from "./tender-metadata";

test("uses English metadata labels only for the English interface", () => {
  const translations = new Map([["region:الرياض", "Riyadh"]]);

  assert.equal(localizedMetadata(translations, "region", "الرياض", "en"), "Riyadh");
  assert.equal(localizedMetadata(translations, "region", "الرياض", "ar"), "الرياض");
});
