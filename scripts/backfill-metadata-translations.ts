import { prisma } from "../src/lib/prisma";
import { translateTenderMetadata } from "../src/lib/translation/tender-metadata";

async function main(): Promise<void> {
  console.log(JSON.stringify(await translateTenderMetadata(prisma), null, 2));
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
