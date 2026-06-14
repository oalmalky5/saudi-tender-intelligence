import type { Prisma, PrismaClient } from "../../generated/prisma/client";

import { csvSourceTenderId, type CsvTender } from "./tender-csv-schema";

export function createCsvTenderData(
  tender: CsvTender,
  observedAt: Date,
): Prisma.TenderCreateInput {
  const sourceTenderId = csvSourceTenderId(tender.referenceNumber);
  return {
    referenceNumber: tender.referenceNumber,
    tenderNumber: tender.tenderNumber,
    sourceTenderId,
    sourceTenderIdString: `csv:${tender.referenceNumber}`,
    sourceUrl: tender.sourceUrl ?? `csv://tender/${encodeURIComponent(tender.referenceNumber)}`,
    sourceSystem: "csv",
    titleArabic: tender.titleArabic,
    titleEnglish: tender.titleEnglish,
    descriptionArabic: tender.descriptionArabic,
    descriptionEnglish: tender.descriptionEnglish,
    agencyNameArabic: tender.agencyNameArabic,
    branchNameArabic: tender.branchNameArabic,
    tenderTypeId: 0,
    tenderTypeNameArabic: tender.tenderTypeNameArabic,
    tenderStatusId: 0,
    tenderStatusNameArabic: tender.tenderStatusNameArabic,
    activityNameArabic: tender.activityNameArabic,
    executionRegionArabic: tender.executionRegionArabic,
    executionCityArabic: tender.executionCityArabic,
    publishedAt: new Date(tender.publishedAt),
    submissionDeadline: tender.submissionDeadline
      ? new Date(tender.submissionDeadline)
      : null,
    sourcePayload: { importSource: "csv", ...tender },
    firstSeenAt: observedAt,
    lastSeenAt: observedAt,
  };
}

export function createCsvTenderUpdateData(
  tender: CsvTender,
  observedAt: Date,
): Prisma.TenderUpdateInput {
  return {
    tenderNumber: tender.tenderNumber,
    titleArabic: tender.titleArabic,
    titleEnglish: tender.titleEnglish,
    descriptionArabic: tender.descriptionArabic,
    descriptionEnglish: tender.descriptionEnglish,
    agencyNameArabic: tender.agencyNameArabic,
    branchNameArabic: tender.branchNameArabic,
    tenderTypeNameArabic: tender.tenderTypeNameArabic,
    tenderStatusNameArabic: tender.tenderStatusNameArabic,
    activityNameArabic: tender.activityNameArabic,
    executionRegionArabic: tender.executionRegionArabic,
    executionCityArabic: tender.executionCityArabic,
    publishedAt: new Date(tender.publishedAt),
    submissionDeadline: tender.submissionDeadline
      ? new Date(tender.submissionDeadline)
      : null,
    sourceUrl: tender.sourceUrl ?? undefined,
    sourcePayload: { importSource: "csv", ...tender },
    lastSeenAt: observedAt,
  };
}

export async function persistCsvTenders(
  db: PrismaClient,
  tenders: CsvTender[],
  observedAt = new Date(),
) {
  const references = tenders.map((tender) => tender.referenceNumber);
  const existing = await db.tender.findMany({
    where: { referenceNumber: { in: references } },
    select: { referenceNumber: true },
  });
  const existingReferences = new Set(existing.map((tender) => tender.referenceNumber));

  await db.$transaction(
    tenders.map((tender) =>
      db.tender.upsert({
        where: { referenceNumber: tender.referenceNumber },
        create: createCsvTenderData(tender, observedAt),
        update: createCsvTenderUpdateData(tender, observedAt),
      }),
    ),
  );

  const updated = tenders.filter((tender) =>
    existingReferences.has(tender.referenceNumber),
  ).length;
  return { total: tenders.length, created: tenders.length - updated, updated };
}
