import assert from "node:assert/strict";
import test from "node:test";

import type { TenderListPreview } from "./map-list-tender";
import {
  createTenderListData,
  createTenderListUpdateData,
} from "./persist-list-tenders";

const observedAt = new Date("2026-06-12T18:00:00.000Z");

const tender: TenderListPreview = {
  referenceNumber: "TEST-1",
  tenderNumber: null,
  sourceTenderId: 123,
  sourceTenderIdString: "encoded-id",
  sourceUrl: "https://tenders.etimad.sa/Tender/DetailsForVisitor",
  titleArabic: "منافسة تجريبية",
  agencyNameArabic: "جهة تجريبية",
  branchNameArabic: null,
  tenderTypeId: 1,
  tenderTypeNameArabic: "عام",
  tenderStatusId: 2,
  tenderStatusNameArabic: "نشط",
  activityId: null,
  activityNameArabic: null,
  publishedAt: new Date("2026-06-12T09:00:00.000Z"),
  enquiriesDeadline: null,
  submissionDeadline: null,
  offersOpeningAt: null,
  documentPrice: null,
  financialFees: null,
  invitationCost: null,
  hasInvitations: false,
  isUgrp: false,
  externalSourceUrl: null,
  sourcePayload: { tenderId: 123 },
};

test("create data records when a tender was first and last observed", () => {
  const data = createTenderListData(tender, observedAt);

  assert.equal(data.firstSeenAt, observedAt);
  assert.equal(data.lastSeenAt, observedAt);
});

test("list updates preserve first-seen and detail-enrichment fields", () => {
  const data = createTenderListUpdateData(tender, observedAt);

  assert.equal("firstSeenAt" in data, false);
  assert.equal("descriptionArabic" in data, false);
  assert.equal("detailsEnrichedAt" in data, false);
  assert.equal(data.lastSeenAt, observedAt);
});
