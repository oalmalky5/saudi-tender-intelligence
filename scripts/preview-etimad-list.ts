import { ZodError } from "zod";

import { fetchEtimadListPage } from "../src/lib/etimad/fetch-list-page";
import { mapEtimadListTender } from "../src/lib/etimad/map-list-tender";

function formatDate(date: Date | null): string {
  return date?.toISOString() ?? "Not provided";
}

async function main() {
  const page = await fetchEtimadListPage(1);
  const tenders = page.data.map(mapEtimadListTender);

  console.log("Etimad list preview");
  console.log("-------------------");
  console.log(`Validated records: ${tenders.length}`);
  console.log(`Active records reported by Etimad: ${page.totalCount}`);
  console.log(`Page: ${page.currentPage}, page size: ${page.pageSize}`);

  for (const tender of tenders.slice(0, 3)) {
    console.log("");
    console.log(`[${tender.referenceNumber}] ${tender.titleArabic}`);
    console.log(`Agency: ${tender.agencyNameArabic}`);
    console.log(`Activity: ${tender.activityNameArabic ?? "Not provided"}`);
    console.log(`Published: ${formatDate(tender.publishedAt)}`);
    console.log(`Submission deadline: ${formatDate(tender.submissionDeadline)}`);
    console.log(`Source: ${tender.sourceUrl}`);
  }

  console.log("");
  console.log("Preview complete. No records were written to the database.");
}

main().catch((error: unknown) => {
  if (error instanceof ZodError) {
    console.error("Etimad response validation failed:");
    console.error(error.issues);
  } else {
    console.error(error instanceof Error ? error.message : error);
  }

  process.exitCode = 1;
});
