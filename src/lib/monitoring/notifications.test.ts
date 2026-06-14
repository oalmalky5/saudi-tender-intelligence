import assert from "node:assert/strict";
import test from "node:test";

import {
  buildDeadlineReminder,
  buildMatchNotification,
  digestPeriodKey,
  type NotificationTender,
} from "./notifications";

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
const tender: NotificationTender = {
  id: "tender-1",
  referenceNumber: "REF-1",
  titleArabic: "innovation tender",
  descriptionArabic: null,
  agencyNameArabic: "Agency",
  activityNameArabic: null,
  classificationFieldArabic: null,
  executionRegionArabic: null,
  tenderTypeNameArabic: "Public",
  submissionDeadline: new Date("2026-06-18T09:00:00.000Z"),
  detailEnrichmentStatus: "complete",
  sourcePayload: { version: 1 },
};

test("creates a match notification only when the threshold is met", () => {
  assert.equal(buildMatchNotification(profile, tender, "new", 50, "v1", now), null);

  const notification = buildMatchNotification(
    profile,
    tender,
    "new",
    10,
    "v1",
    now,
  );
  assert.equal(notification?.type, "NEW_MATCH");
  assert.match(notification?.uniqueKey ?? "", /tender-1:v1/);
});

test("creates one stable deadline reminder key for a deadline", () => {
  const reminder = buildDeadlineReminder(profile, tender, 10, 7, now);

  assert.equal(reminder?.type, "DEADLINE_REMINDER");
  assert.match(reminder?.title ?? "", /5 days/);
  assert.equal(
    reminder?.uniqueKey,
    "DEADLINE_REMINDER:tender-1:2026-06-18T09:00:00.000Z:7",
  );
});

test("creates daily, weekly, or disabled digest periods", () => {
  assert.equal(digestPeriodKey("DAILY", now), "DAILY:2026-06-13");
  assert.match(digestPeriodKey("WEEKLY", now) ?? "", /^WEEKLY:/);
  assert.equal(digestPeriodKey("NONE", now), null);
});
