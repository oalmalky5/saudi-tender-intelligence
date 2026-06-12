import type { Prisma, PrismaClient } from "../../generated/prisma/client";
import type { TenderListPreview } from "./map-list-tender";

export type PersistListTendersResult = {
  created: number;
  updated: number;
  total: number;
};

function toInputJsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export function createTenderListData(
  tender: TenderListPreview,
  observedAt: Date,
): Prisma.TenderCreateInput {
  return {
    referenceNumber: tender.referenceNumber,
    tenderNumber: tender.tenderNumber,
    sourceTenderId: tender.sourceTenderId,
    sourceTenderIdString: tender.sourceTenderIdString,
    sourceUrl: tender.sourceUrl,
    titleArabic: tender.titleArabic,
    agencyNameArabic: tender.agencyNameArabic,
    branchNameArabic: tender.branchNameArabic,
    tenderTypeId: tender.tenderTypeId,
    tenderTypeNameArabic: tender.tenderTypeNameArabic,
    tenderStatusId: tender.tenderStatusId,
    tenderStatusNameArabic: tender.tenderStatusNameArabic,
    activityId: tender.activityId,
    activityNameArabic: tender.activityNameArabic,
    publishedAt: tender.publishedAt,
    enquiriesDeadline: tender.enquiriesDeadline,
    submissionDeadline: tender.submissionDeadline,
    offersOpeningAt: tender.offersOpeningAt,
    documentPrice: tender.documentPrice,
    financialFees: tender.financialFees,
    invitationCost: tender.invitationCost,
    hasInvitations: tender.hasInvitations,
    isUgrp: tender.isUgrp,
    externalSourceUrl: tender.externalSourceUrl,
    sourcePayload: toInputJsonValue(tender.sourcePayload),
    firstSeenAt: observedAt,
    lastSeenAt: observedAt,
  };
}

export function createTenderListUpdateData(
  tender: TenderListPreview,
  observedAt: Date,
): Prisma.TenderUpdateInput {
  const updateData: Prisma.TenderUpdateInput = createTenderListData(
    tender,
    observedAt,
  );
  delete updateData.firstSeenAt;

  return updateData;
}

export async function persistTenderList(
  db: PrismaClient,
  tenders: TenderListPreview[],
  observedAt = new Date(),
): Promise<PersistListTendersResult> {
  const referenceNumbers = tenders.map((tender) => tender.referenceNumber);
  const existingTenders = await db.tender.findMany({
    where: { referenceNumber: { in: referenceNumbers } },
    select: { referenceNumber: true },
  });
  const existingReferenceNumbers = new Set(
    existingTenders.map((tender) => tender.referenceNumber),
  );

  await db.$transaction(
    tenders.map((tender) =>
      db.tender.upsert({
        where: { referenceNumber: tender.referenceNumber },
        create: createTenderListData(tender, observedAt),
        update: createTenderListUpdateData(tender, observedAt),
      }),
    ),
  );

  const updated = tenders.filter((tender) =>
    existingReferenceNumbers.has(tender.referenceNumber),
  ).length;

  return {
    created: tenders.length - updated,
    updated,
    total: tenders.length,
  };
}
