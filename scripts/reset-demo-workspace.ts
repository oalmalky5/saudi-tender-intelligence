import { prisma } from "../src/lib/prisma";

async function main(): Promise<void> {
  const workspaceId = process.env.MONITOR_WORKSPACE_ID ?? "primary-workspace";

  if (!process.argv.includes("--confirm")) {
    throw new Error(
      "Demo reset cancelled. Re-run with --confirm after reviewing the reset scope.",
    );
  }

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: { companyProfile: { select: { id: true } } },
  });

  if (!workspace?.isDemo || !workspace.companyProfile) {
    throw new Error(
      `Workspace ${workspaceId} is missing, has no profile, or is not marked as a demo workspace.`,
    );
  }

  const companyProfileId = workspace.companyProfile.id;
  const reset = await prisma.$transaction(async (tx) => ({
    notifications: (
      await tx.notification.deleteMany({ where: { companyProfileId } })
    ).count,
    monitoringRuns: (
      await tx.monitoringRun.deleteMany({ where: { workspaceId } })
    ).count,
    tenderDecisions: (
      await tx.tenderDecision.deleteMany({ where: { workspaceId } })
    ).count,
    aiSummaries: (
      await tx.tenderAiSummary.deleteMany({ where: { workspaceId } })
    ).count,
    chatRuns: (await tx.tenderChatRun.deleteMany({ where: { workspaceId } }))
      .count,
    aiMatchRuns: (
      await tx.tenderAiMatchRun.deleteMany({ where: { companyProfileId } })
    ).count,
    weeklyReports: (
      await tx.weeklyTenderReport.deleteMany({ where: { companyProfileId } })
    ).count,
    csvImports: (
      await tx.csvImportSession.deleteMany({ where: { workspaceId } })
    ).count,
    rateLimitBuckets: (
      await tx.rateLimitBucket.deleteMany({ where: { key: workspaceId } })
    ).count,
  }));

  console.info(JSON.stringify({ workspaceId, reset }, null, 2));
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
