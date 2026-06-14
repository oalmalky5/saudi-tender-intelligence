import type { MatchProfile, MatchTender } from "@/lib/matching/score-tender";
import { scoreTenderMatch } from "@/lib/matching/score-tender";

export type NotificationTender = MatchTender & {
  id: string;
  referenceNumber: string;
  titleArabic: string;
  sourcePayload: unknown;
};

export type NotificationDraft = {
  uniqueKey: string;
  tenderId: string;
  type: "NEW_MATCH" | "UPDATED_MATCH" | "DEADLINE_REMINDER";
  title: string;
  body: string;
  relevanceScore: number;
  reasons: string[];
};

export function buildMatchNotification(
  profile: MatchProfile,
  tender: NotificationTender,
  kind: "new" | "updated",
  threshold: number,
  versionKey: string,
  now = new Date(),
): NotificationDraft | null {
  const match = scoreTenderMatch(profile, tender, now);
  if (!match.hasDirectScopeMatch || match.score < threshold) {
    return null;
  }

  const type = kind === "new" ? "NEW_MATCH" : "UPDATED_MATCH";
  return {
    uniqueKey: `${type}:${tender.id}:${versionKey}`,
    tenderId: tender.id,
    type,
    title:
      kind === "new"
        ? `New relevant tender: ${tender.titleArabic}`
        : `Relevant tender updated: ${tender.titleArabic}`,
    body: `${match.score}% deterministic relevance score. Review the public tender details before deciding whether to pursue it.`,
    relevanceScore: match.score,
    reasons: match.reasons,
  };
}

export function buildDeadlineReminder(
  profile: MatchProfile,
  tender: NotificationTender,
  threshold: number,
  reminderDays: number,
  now = new Date(),
): NotificationDraft | null {
  if (!tender.submissionDeadline) {
    return null;
  }

  const millisecondsPerDay = 24 * 60 * 60 * 1_000;
  const daysRemaining = Math.ceil(
    (tender.submissionDeadline.getTime() - now.getTime()) / millisecondsPerDay,
  );
  const match = scoreTenderMatch(profile, tender, now);

  if (
    daysRemaining < 0 ||
    daysRemaining > reminderDays ||
    !match.hasDirectScopeMatch ||
    match.score < threshold
  ) {
    return null;
  }

  return {
    uniqueKey: `DEADLINE_REMINDER:${tender.id}:${tender.submissionDeadline.toISOString()}:${reminderDays}`,
    tenderId: tender.id,
    type: "DEADLINE_REMINDER",
    title: `Tender deadline in ${daysRemaining} day${daysRemaining === 1 ? "" : "s"}`,
    body: `${tender.titleArabic} closes soon and currently scores ${match.score}% relevance.`,
    relevanceScore: match.score,
    reasons: match.reasons,
  };
}

export function digestPeriodKey(
  frequency: string,
  now = new Date(),
): string | null {
  if (frequency === "NONE") {
    return null;
  }
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Riyadh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  if (frequency === "DAILY") {
    return `DAILY:${date}`;
  }

  const start = new Date(now);
  start.setUTCDate(start.getUTCDate() - start.getUTCDay());
  const week = start.toISOString().slice(0, 10);
  return `WEEKLY:${week}`;
}
