import assert from "node:assert/strict";
import test from "node:test";

import { parseTenderCsv } from "./parse-tender-csv";

const header =
  "referenceNumber,titleArabic,agencyNameArabic,tenderTypeNameArabic,publishedAt,descriptionEnglish";

test("parses quoted CSV values and validates rows", () => {
  const preview = parseTenderCsv(
    `${header}\nCSV-1,\"عنوان، يتضمن فاصلة\",جهة,عامة,2026-06-13T09:00:00+03:00,\"English, description\"`,
  );

  assert.equal(preview.validRows, 1);
  assert.equal(preview.rows[0]?.tender?.descriptionEnglish, "English, description");
});

test("detects duplicate references within one file", () => {
  const preview = parseTenderCsv(
    `${header}\nCSV-1,عنوان,جهة,عامة,2026-06-13T09:00:00+03:00,\nCSV-1,عنوان آخر,جهة,عامة,2026-06-13T09:00:00+03:00,`,
  );

  assert.equal(preview.validRows, 1);
  assert.equal(preview.duplicateRows, 1);
});

test("reports invalid rows without rejecting the whole preview", () => {
  const preview = parseTenderCsv(
    `${header}\nCSV-1,,جهة,عامة,not-a-date,`,
  );

  assert.equal(preview.invalidRows, 1);
  assert.match(preview.rows[0]?.errors.join(" ") ?? "", /titleArabic|publishedAt/);
});

test("rejects files missing required mapped fields", () => {
  assert.throws(
    () => parseTenderCsv("referenceNumber,titleArabic\nCSV-1,عنوان"),
    /Missing required mapped fields/,
  );
});
