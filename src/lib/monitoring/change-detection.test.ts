import assert from "node:assert/strict";
import test from "node:test";

import type { TenderListPreview } from "@/lib/etimad/map-list-tender";

import { classifyTenderChanges, tenderVersionKey } from "./change-detection";

function tender(
  referenceNumber: string,
  sourcePayload: Record<string, unknown>,
): TenderListPreview {
  return {
    referenceNumber,
    tenderNumber: null,
    sourceTenderId: Number(referenceNumber.replace(/\D/g, "")) || 1,
    sourceTenderIdString: referenceNumber,
    sourceUrl: "https://tenders.etimad.sa",
    titleArabic: "منافسة",
    agencyNameArabic: "جهة",
    branchNameArabic: null,
    tenderTypeId: 1,
    tenderTypeNameArabic: "عام",
    tenderStatusId: 1,
    tenderStatusNameArabic: "نشط",
    activityId: null,
    activityNameArabic: null,
    publishedAt: new Date("2026-06-13T00:00:00.000Z"),
    enquiriesDeadline: null,
    submissionDeadline: null,
    offersOpeningAt: null,
    documentPrice: null,
    financialFees: null,
    invitationCost: null,
    hasInvitations: false,
    isUgrp: false,
    externalSourceUrl: null,
    sourcePayload: sourcePayload as never,
  };
}

test("version keys ignore object key order", () => {
  assert.equal(
    tenderVersionKey({ a: 1, nested: { b: 2, c: 3 } }),
    tenderVersionKey({ nested: { c: 3, b: 2 }, a: 1 }),
  );
});

test("version keys ignore Etimad countdown and request-time fields", () => {
  assert.equal(
    tenderVersionKey({
      status: "same",
      remainingMins: 4,
      currentDateTime: "2026-06-13T12:00:00+03:00",
    }),
    tenderVersionKey({
      status: "same",
      remainingMins: 3,
      currentDateTime: "2026-06-13T12:01:00+03:00",
    }),
  );
});

test("classifies new, changed, and unchanged tenders", () => {
  const incoming = [
    tender("NEW-1", { status: "new" }),
    tender("CHANGED-2", { status: "changed" }),
    tender("SAME-3", { status: "same" }),
  ];
  const changes = classifyTenderChanges(
    [
      { referenceNumber: "CHANGED-2", sourcePayload: { status: "old" } },
      { referenceNumber: "SAME-3", sourcePayload: { status: "same" } },
    ],
    incoming,
  );

  assert.deepEqual(
    changes.newTenders.map((item) => item.referenceNumber),
    ["NEW-1"],
  );
  assert.deepEqual(
    changes.changedTenders.map((item) => item.referenceNumber),
    ["CHANGED-2"],
  );
  assert.deepEqual(
    changes.unchangedTenders.map((item) => item.referenceNumber),
    ["SAME-3"],
  );
});
