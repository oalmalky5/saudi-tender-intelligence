import { fetchEtimadTenderDetail } from "../src/lib/etimad/fetch-tender-detail";
import { parseEtimadTenderDetail } from "../src/lib/etimad/parse-tender-detail";
import { persistTenderDetail } from "../src/lib/etimad/persist-tender-detail";
import { prisma } from "../src/lib/prisma";

async function selectTender(referenceNumber: string | undefined) {
  return prisma.tender.findFirst({
    where: referenceNumber
      ? { referenceNumber }
      : { isUgrp: false, detailEnrichmentStatus: { not: "complete" } },
    orderBy: { publishedAt: "desc" },
    select: {
      id: true,
      referenceNumber: true,
      sourceTenderIdString: true,
      sourceUrl: true,
    },
  });
}

async function main() {
  const referenceNumber = process.argv[2];
  const tender = await selectTender(referenceNumber);

  if (!tender) {
    throw new Error(
      referenceNumber
        ? `No stored tender found with reference number ${referenceNumber}.`
        : "No unenriched non-UGRP tender is available.",
    );
  }

  console.log(`Enriching ${tender.referenceNumber}...`);

  try {
    const snapshot = await fetchEtimadTenderDetail(tender.sourceTenderIdString);
    const detail = parseEtimadTenderDetail(snapshot);
    await persistTenderDetail(prisma, tender.id, snapshot, detail);

    console.log("Tender detail enrichment complete.");
    console.log(`Internal page: http://localhost:3000/tenders/${tender.id}`);
    console.log(`Source: ${tender.sourceUrl}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await prisma.tender.update({
      where: { id: tender.id },
      data: {
        detailEnrichmentStatus: "failed",
        detailEnrichmentError: message,
      },
    });
    throw error;
  }
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
