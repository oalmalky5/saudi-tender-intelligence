import { prisma } from "../src/lib/prisma";
import { syncEtimadGovernmentAgencies } from "../src/lib/etimad/government-agencies";
import { translateTenderMetadata } from "../src/lib/translation/tender-metadata";

async function main(): Promise<void> {
  const sync = await syncEtimadGovernmentAgencies(prisma);
  const translations = await translateTenderMetadata(prisma);
  console.log(JSON.stringify({ sync, translations }, null, 2));
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
