import assert from "node:assert/strict";
import test from "node:test";

import type { CsvTender } from "./tender-csv-schema";
import {
  createCsvTenderData,
  createCsvTenderUpdateData,
} from "./persist-csv-tenders";

const observedAt = new Date("2026-06-13T12:00:00.000Z");
const tender: CsvTender = {
  referenceNumber: "CSV-1",
  tenderNumber: null,
  titleArabic: "منافسة تجريبية",
  titleEnglish: "Test tender",
  descriptionArabic: null,
  descriptionEnglish: null,
  agencyNameArabic: "جهة",
  branchNameArabic: null,
  tenderTypeNameArabic: "عامة",
  tenderStatusNameArabic: null,
  activityNameArabic: null,
  executionRegionArabic: null,
  executionCityArabic: null,
  publishedAt: "2026-06-13T06:00:00.000Z",
  submissionDeadline: null,
  sourceUrl: null,
};

test("creates CSV tenders with a stable CSV source identity", () => {
  const data = createCsvTenderData(tender, observedAt);

  assert.equal(data.sourceSystem, "csv");
  assert.equal(data.sourceTenderIdString, "csv:CSV-1");
  assert.ok(typeof data.sourceTenderId === "number" && data.sourceTenderId < 0);
});

test("CSV updates preserve existing source identity and first-seen fields", () => {
  const data = createCsvTenderUpdateData(tender, observedAt);

  assert.equal("sourceSystem" in data, false);
  assert.equal("sourceTenderId" in data, false);
  assert.equal("firstSeenAt" in data, false);
  assert.equal(data.lastSeenAt, observedAt);
});
