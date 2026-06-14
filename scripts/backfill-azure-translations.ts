import {
  buildTenderTranslationSource,
  hashTenderTranslationSource,
} from "../src/lib/ai/tender-translation-source";
import { prisma } from "../src/lib/prisma";
import { automaticallyTranslateTenders } from "../src/lib/translation/automatic-tender-translation";

async function main(): Promise<void> {
  const requestedLimit = Number(process.argv[2] ?? 100);
  if (!Number.isInteger(requestedLimit) || requestedLimit < 1 || requestedLimit > 500) {
    throw new Error("Backfill limit must be an integer between 1 and 500.");
  }

  const candidates = await prisma.tender.findMany({
    orderBy: { publishedAt: "desc" },
    take: 1_000,
    select: {
      id: true,
      titleArabic: true,
      descriptionArabic: true,
      translations: {
        where: { provider: "AZURE" },
        select: { sourceHash: true },
      },
    },
  });
  const pendingIds = candidates
    .filter((tender) => {
      const sourceHash = hashTenderTranslationSource(
        buildTenderTranslationSource(tender),
      );
      return !tender.translations.some(
        (translation) => translation.sourceHash === sourceHash,
      );
    })
    .slice(0, requestedLimit)
    .map((tender) => tender.id);

  const result = await automaticallyTranslateTenders(
    prisma,
    pendingIds,
    requestedLimit,
  );
  console.log(JSON.stringify({ selected: pendingIds.length, ...result }, null, 2));
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
