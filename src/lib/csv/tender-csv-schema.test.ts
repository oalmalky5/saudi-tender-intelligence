import assert from "node:assert/strict";
import test from "node:test";

import { csvSourceTenderId, mapCsvHeaders } from "./tender-csv-schema";

test("automatically maps canonical and friendly CSV headers", () => {
  const mapping = mapCsvHeaders([
    "Reference",
    "Arabic Title",
    "Agency",
    "Tender Type",
    "Publication Date",
  ]);

  assert.equal(mapping.referenceNumber, "Reference");
  assert.equal(mapping.titleArabic, "Arabic Title");
  assert.equal(mapping.agencyNameArabic, "Agency");
  assert.equal(mapping.tenderTypeNameArabic, "Tender Type");
  assert.equal(mapping.publishedAt, "Publication Date");
});

test("CSV source IDs are stable, negative, and reference-sensitive", () => {
  const first = csvSourceTenderId("CSV-100");

  assert.equal(first, csvSourceTenderId("CSV-100"));
  assert.ok(first < 0);
  assert.notEqual(first, csvSourceTenderId("CSV-101"));
});
