import { ZodError } from "zod";

import { fetchEtimadListPages } from "../src/lib/etimad/fetch-list-pages";
import { mapEtimadListTender } from "../src/lib/etimad/map-list-tender";
import { persistTenderList } from "../src/lib/etimad/persist-list-tenders";
import { prisma } from "../src/lib/prisma";
import { automaticallyTranslateTenders } from "../src/lib/translation/automatic-tender-translation";
import { translateTenderMetadata } from "../src/lib/translation/tender-metadata";

async function main() {
  const pages = await fetchEtimadListPages(5);
  const tenders = pages.tenders.map(mapEtimadListTender);
  const result = await persistTenderList(prisma, tenders);
  const stored = await prisma.tender.findMany({
    where: {
      referenceNumber: { in: tenders.map((tender) => tender.referenceNumber) },
    },
    select: { id: true },
  });
  const translations = await automaticallyTranslateTenders(
    prisma,
    stored.map((tender) => tender.id),
    stored.length,
  );
  const metadataTranslations = await translateTenderMetadata(prisma);

  console.log("Etimad list import");
  console.log("------------------");
  console.log(`Validated: ${result.total}`);
  console.log(`Created: ${result.created}`);
  console.log(`Updated: ${result.updated}`);
  console.log(`Pages fetched: ${pages.pagesFetched}`);
  console.log(`Active records reported by Etimad: ${pages.totalCount}`);
  console.log(`Automatically translated: ${translations.translated}`);
  console.log(`Translation failures: ${translations.failed}`);
  console.log(`Metadata labels translated: ${metadataTranslations.translated}`);
}

main()
  .catch((error: unknown) => {
    if (error instanceof ZodError) {
      console.error("Etimad response validation failed:");
      console.error(error.issues);
    } else {
      console.error(error instanceof Error ? error.message : error);
    }

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
