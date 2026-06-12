import type { EtimadListTender } from "./list-schema";

const ETIMAD_BASE_URL = "https://tenders.etimad.sa";
const SAUDI_UTC_OFFSET = "+03:00";

export type TenderListPreview = {
  referenceNumber: string;
  tenderNumber: string | null;
  sourceTenderId: number;
  sourceTenderIdString: string;
  sourceUrl: string;
  titleArabic: string;
  agencyNameArabic: string;
  branchNameArabic: string | null;
  tenderTypeId: number;
  tenderTypeNameArabic: string;
  tenderStatusId: number;
  tenderStatusNameArabic: string | null;
  activityId: number | null;
  activityNameArabic: string | null;
  publishedAt: Date;
  enquiriesDeadline: Date | null;
  submissionDeadline: Date | null;
  offersOpeningAt: Date | null;
  documentPrice: number | null;
  financialFees: number | null;
  invitationCost: number | null;
  hasInvitations: boolean | null;
  isUgrp: boolean;
  externalSourceUrl: string | null;
  sourcePayload: EtimadListTender;
};

function parseEtimadDate(value: string | null, fieldName: string): Date | null {
  if (value === null) {
    return null;
  }

  const includesOffset = /(?:Z|[+-]\d{2}:\d{2})$/.test(value);
  const date = new Date(includesOffset ? value : `${value}${SAUDI_UTC_OFFSET}`);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Etimad returned an invalid ${fieldName}: ${value}`);
  }

  return date;
}

function createDetailsUrl(tenderIdString: string): string {
  const url = new URL("/Tender/DetailsForVisitor", ETIMAD_BASE_URL);
  url.searchParams.set("STenderId", tenderIdString);
  return url.toString();
}

export function mapEtimadListTender(
  tender: EtimadListTender,
): TenderListPreview {
  const publishedAt = parseEtimadDate(tender.submitionDate, "submitionDate");

  if (publishedAt === null) {
    throw new Error("Etimad tender is missing its publication date.");
  }

  return {
    referenceNumber: tender.referenceNumber,
    tenderNumber: tender.tenderNumber,
    sourceTenderId: tender.tenderId,
    sourceTenderIdString: tender.tenderIdString,
    sourceUrl: createDetailsUrl(tender.tenderIdString),
    titleArabic: tender.tenderName.trim(),
    agencyNameArabic: tender.agencyName.trim(),
    branchNameArabic: tender.branchName?.trim() || null,
    tenderTypeId: tender.tenderTypeId,
    tenderTypeNameArabic: tender.tenderTypeName.trim(),
    tenderStatusId: tender.tenderStatusId,
    tenderStatusNameArabic: tender.tenderStatusName?.trim() || null,
    activityId: tender.tenderActivityId,
    activityNameArabic: tender.tenderActivityName?.trim() || null,
    publishedAt,
    enquiriesDeadline: parseEtimadDate(
      tender.lastEnqueriesDate,
      "lastEnqueriesDate",
    ),
    submissionDeadline: parseEtimadDate(
      tender.lastOfferPresentationDate,
      "lastOfferPresentationDate",
    ),
    offersOpeningAt: parseEtimadDate(
      tender.offersOpeningDate,
      "offersOpeningDate",
    ),
    documentPrice: tender.condetionalBookletPrice,
    financialFees: tender.financialFees,
    invitationCost: tender.invitationCost,
    hasInvitations: tender.hasInvitations,
    isUgrp: tender.isUGRP,
    externalSourceUrl: tender.ugrpRfxUrl,
    sourcePayload: tender,
  };
}
