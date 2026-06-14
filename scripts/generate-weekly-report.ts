import { prisma } from "../src/lib/prisma";
import { createWeeklyTenderReport } from "../src/lib/reports/create-weekly-report";

async function main() {
  const now = new Date();
  const dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1_000);
  const report = await createWeeklyTenderReport(prisma, dateFrom, now);

  console.log("Weekly tender report generated");
  console.log("------------------------------");
  console.log(`Report ID: ${report.id}`);
  console.log(`Candidates reviewed: ${report.candidateCount}`);
  console.log(`Tenders included: ${report.tenders.length}`);
  console.log(`Tokens: ${report.totalTokens ?? "unknown"}`);
  console.log(`Estimated cost: $${report.estimatedCostUsd?.toString() ?? "unknown"}`);
  console.log("Report page: http://localhost:3000/reports/weekly");
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
