import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/reliability/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;
    const response = {
      status: "ok",
      timestamp: new Date().toISOString(),
      checks: {
        database: "ok",
        sessionSecretConfigured: Boolean(process.env.SESSION_SECRET),
        openAiConfigured: Boolean(process.env.OPENAI_API_KEY),
      },
    };
    logger.info("health_check_succeeded", { durationMs: Date.now() - startedAt });
    return Response.json(response);
  } catch (error) {
    logger.error("health_check_failed", {
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
    });
    return Response.json(
      {
        status: "degraded",
        timestamp: new Date().toISOString(),
        checks: {
          database: "failed",
          sessionSecretConfigured: Boolean(process.env.SESSION_SECRET),
          openAiConfigured: Boolean(process.env.OPENAI_API_KEY),
        },
      },
      { status: 503 },
    );
  }
}
