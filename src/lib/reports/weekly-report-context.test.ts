import assert from "node:assert/strict";
import test from "node:test";

import type { WeeklyReportTender } from "./weekly-report-context";
import { selectWeeklyReportCandidates } from "./weekly-report-context";

const profile = {
  services: ["innovation"],
  activities: [],
  industries: [],
  targetGovernmentEntities: [],
  regions: [],
  preferredKeywords: [],
  excludedKeywords: [],
  preferredOpportunityTypes: [],
};
const now = new Date("2026-06-13T09:00:00.000Z");

function tender(
  id: string,
  titleArabic: string,
  decision: string | null = null,
): WeeklyReportTender {
  return {
    id,
    referenceNumber: id,
    titleArabic,
    titleEnglish: null,
    descriptionArabic: null,
    descriptionEnglish: null,
    agencyNameArabic: "Agency",
    tenderTypeNameArabic: "Public",
    tenderStatusNameArabic: "Open",
    activityNameArabic: null,
    classificationFieldArabic: null,
    executionRegionArabic: null,
    publishedAt: now,
    submissionDeadline: new Date("2026-06-18T09:00:00.000Z"),
    detailEnrichmentStatus: "complete",
    updatedAt: now,
    decision: decision ? { status: decision, note: null } : null,
  };
}

test("prioritizes saved and relevant tenders within the report cap", () => {
  const selected = selectWeeklyReportCandidates(
    profile,
    [
      tender("recent", "unrelated"),
      tender("relevant", "innovation opportunity"),
      tender("saved", "unrelated saved", "SAVED"),
    ],
    new Date("2026-06-06T00:00:00.000Z"),
    now,
    now,
    2,
  );

  assert.deepEqual(selected.map((item) => item.id), ["saved", "relevant"]);
});
