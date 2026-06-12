import type { Prisma, PrismaClient } from "../../generated/prisma/client";
import type { EtimadTenderDetailSnapshot } from "./fetch-tender-detail";
import type { ParsedEtimadTenderDetail } from "./parse-tender-detail";

function toInputJsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export async function persistTenderDetail(
  db: PrismaClient,
  tenderId: string,
  snapshot: EtimadTenderDetailSnapshot,
  detail: ParsedEtimadTenderDetail,
  enrichedAt = new Date(),
): Promise<void> {
  const { attachments, ...tenderDetail } = detail;
  const snapshotData = {
    ...snapshot,
    parsedPayload: toInputJsonValue(detail),
    fetchedAt: enrichedAt,
  };

  await db.$transaction([
    db.tender.update({
      where: { id: tenderId },
      data: {
        ...tenderDetail,
        detailEnrichmentStatus: "complete",
        detailEnrichmentError: null,
        detailsEnrichedAt: enrichedAt,
      },
    }),
    db.tenderDetailSnapshot.upsert({
      where: { tenderId },
      create: { tenderId, ...snapshotData },
      update: snapshotData,
    }),
    db.tenderAttachment.deleteMany({ where: { tenderId } }),
    db.tenderAttachment.createMany({
      data: attachments.map((attachment) => ({ tenderId, ...attachment })),
    }),
  ]);
}
