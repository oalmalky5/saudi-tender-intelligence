import { timingSafeEqual } from "node:crypto";

import { runMonitoring } from "@/lib/monitoring/run-monitoring";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/reliability/logger";
import { enforceWorkspaceRateLimit, RATE_LIMITS } from "@/lib/reliability/rate-limit";

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");
  if (!secret || !authorization?.startsWith("Bearer ")) {
    return false;
  }

  const provided = Buffer.from(authorization.slice("Bearer ".length));
  const expected = Buffer.from(secret);
  return (
    provided.length === expected.length && timingSafeEqual(provided, expected)
  );
}

export async function POST(request: Request) {
  if (!authorized(request)) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const workspaceId = process.env.MONITOR_WORKSPACE_ID ?? "primary-workspace";
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: { companyProfile: { select: { id: true } } },
  });

  if (!workspace?.companyProfile) {
    logger.error("scheduled_monitoring_failed", {
      workspaceId,
      error: "Workspace or company profile not found.",
    });
    return Response.json(
      { error: "Monitoring workspace or company profile not found." },
      { status: 500 },
    );
  }

  try {
    await enforceWorkspaceRateLimit(workspaceId, RATE_LIMITS.monitoring);
    const run = await runMonitoring(prisma, {
      workspaceId,
      companyProfileId: workspace.companyProfile.id,
    });
    logger.info("scheduled_monitoring_completed", {
      workspaceId,
      runId: run.id,
      status: run.status,
      recordsFetched: run.recordsFetched,
      notificationCount: run.notificationCount,
    });
    return Response.json({
      runId: run.id,
      status: run.status,
      recordsFetched: run.recordsFetched,
      newTenderCount: run.newTenderCount,
      changedTenderCount: run.changedTenderCount,
      notificationCount: run.notificationCount,
    });
  } catch (error) {
    logger.error("scheduled_monitoring_failed", {
      workspaceId,
      error: error instanceof Error ? error.message : String(error),
    });
    return Response.json({ error: "Monitoring run failed." }, { status: 502 });
  }
}
