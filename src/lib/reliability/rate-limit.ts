import { prisma } from "@/lib/prisma";

export type RateLimitRule = {
  action: string;
  limit: number;
  windowSeconds: number;
};

export const RATE_LIMITS = {
  paidAi: { action: "paid-ai", limit: 20, windowSeconds: 60 * 60 },
  bookletAnalysis: {
    action: "booklet-analysis",
    limit: 4,
    windowSeconds: 60 * 60,
  },
  bookletUpload: {
    action: "booklet-upload",
    limit: 6,
    windowSeconds: 60 * 60,
  },
  csvImport: { action: "csv-import", limit: 10, windowSeconds: 60 * 60 },
  monitoring: { action: "monitoring", limit: 3, windowSeconds: 60 * 60 },
} satisfies Record<string, RateLimitRule>;

export function rateLimitWindowStart(now: Date, windowSeconds: number): Date {
  const windowMs = windowSeconds * 1_000;
  return new Date(Math.floor(now.getTime() / windowMs) * windowMs);
}

export function rateLimitRetrySeconds(
  now: Date,
  windowStart: Date,
  windowSeconds: number,
): number {
  return Math.max(
    1,
    Math.ceil(
      (windowStart.getTime() + windowSeconds * 1_000 - now.getTime()) / 1_000,
    ),
  );
}

function retryDescription(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} second${seconds === 1 ? "" : "s"}`;
  }
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} minute${minutes === 1 ? "" : "s"}`;
}

export async function enforceWorkspaceRateLimit(
  workspaceId: string,
  rule: RateLimitRule,
  now = new Date(),
): Promise<void> {
  const windowStart = rateLimitWindowStart(now, rule.windowSeconds);
  const bucket = await prisma.rateLimitBucket.upsert({
    where: {
      key_action_windowStart: {
        key: workspaceId,
        action: rule.action,
        windowStart,
      },
    },
    create: {
      key: workspaceId,
      action: rule.action,
      windowStart,
      count: 1,
    },
    update: { count: { increment: 1 } },
    select: { count: true },
  });

  if (bucket.count > rule.limit) {
    const retrySeconds = rateLimitRetrySeconds(
      now,
      windowStart,
      rule.windowSeconds,
    );
    throw new Error(
      `Demo rate limit reached for ${rule.action}. Try again in ${retryDescription(retrySeconds)}.`,
    );
  }
}
