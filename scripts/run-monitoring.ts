import { prisma } from "../src/lib/prisma";
import { runMonitoring } from "../src/lib/monitoring/run-monitoring";

async function main() {
  const run = await runMonitoring(prisma);

  console.log("Etimad monitoring run");
  console.log("---------------------");
  console.log(`Status: ${run.status}`);
  console.log(`Fetched: ${run.recordsFetched} records from ${run.pagesFetched} pages`);
  console.log(`New: ${run.newTenderCount}`);
  console.log(`Changed: ${run.changedTenderCount}`);
  console.log(`Unchanged: ${run.unchangedTenderCount}`);
  console.log(`Enriched: ${run.enrichedCount}`);
  console.log(`Enrichment errors: ${run.enrichmentErrorCount}`);
  console.log(`Notifications created: ${run.notificationCount}`);
  console.log("Notification center: http://localhost:3000/notifications");
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
