import { ZodError } from "zod";

import { fetchEtimadListPage } from "../src/lib/etimad/fetch-list-page";
import { mapEtimadListTender } from "../src/lib/etimad/map-list-tender";
import { persistTenderList } from "../src/lib/etimad/persist-list-tenders";
import { prisma } from "../src/lib/prisma";

async function main() {
  const page = await fetchEtimadListPage(1);
  const tenders = page.data.map(mapEtimadListTender);
  const result = await persistTenderList(prisma, tenders);

  console.log("Etimad list import");
  console.log("------------------");
  console.log(`Validated: ${result.total}`);
  console.log(`Created: ${result.created}`);
  console.log(`Updated: ${result.updated}`);
  console.log(`Active records reported by Etimad: ${page.totalCount}`);
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
