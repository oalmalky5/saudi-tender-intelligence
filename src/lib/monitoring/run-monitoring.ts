import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { fetchEtimadListPages } from "@/lib/etimad/fetch-list-pages";
import { fetchEtimadTenderDetail } from "@/lib/etimad/fetch-tender-detail";
import { syncEtimadGovernmentAgencies } from "@/lib/etimad/government-agencies";
import { mapEtimadListTender } from "@/lib/etimad/map-list-tender";
import { parseEtimadTenderDetail } from "@/lib/etimad/parse-tender-detail";
import { persistTenderDetail } from "@/lib/etimad/persist-tender-detail";
import { persistTenderList } from "@/lib/etimad/persist-list-tenders";
import { automaticallyTranslateTenders } from "@/lib/translation/automatic-tender-translation";
import { translateTenderMetadata } from "@/lib/translation/tender-metadata";

import { classifyTenderChanges, tenderVersionKey } from "./change-detection";
import {
  buildDeadlineReminder,
  buildMatchNotification,
  digestPeriodKey,
  type NotificationTender,
} from "./notifications";

export type MonitoringOptions = {
  pageLimit?: number;
  enrichmentLimit?: number;
  now?: Date;
  workspaceId?: string;
  companyProfileId?: string;
};

export async function runMonitoring(
  db: PrismaClient,
  options: MonitoringOptions = {},
) {
  const pageLimit = options.pageLimit ?? 5;
  const enrichmentLimit = options.enrichmentLimit ?? 5;
  const now = options.now ?? new Date();
  const workspaceId = options.workspaceId ?? "primary-workspace";
  const companyProfileId = options.companyProfileId ?? "primary";
  const run = await db.monitoringRun.create({
    data: { workspaceId, status: "running" },
  });

  try {
    const pages = await fetchEtimadListPages(pageLimit);
    await syncEtimadGovernmentAgencies(db, now);
    const incoming = pages.tenders.map(mapEtimadListTender);
    const references = incoming.map((tender) => tender.referenceNumber);
    const existing = await db.tender.findMany({
      where: { referenceNumber: { in: references } },
      select: { referenceNumber: true, sourcePayload: true },
    });
    const changes = classifyTenderChanges(existing, incoming);
    const affected = [...changes.newTenders, ...changes.changedTenders];

    await persistTenderList(db, incoming, now);

    if (changes.changedTenders.length > 0) {
      await db.tender.updateMany({
        where: {
          referenceNumber: {
            in: changes.changedTenders.map((tender) => tender.referenceNumber),
          },
        },
        data: { detailEnrichmentStatus: "pending", detailEnrichmentError: null },
      });
    }

    let enrichedCount = 0;
    let enrichmentErrorCount = 0;
    const enrichmentCandidates = affected
      .filter((tender) => !tender.isUgrp)
      .slice(0, enrichmentLimit);

    for (const candidate of enrichmentCandidates) {
      const stored = await db.tender.findUniqueOrThrow({
        where: { referenceNumber: candidate.referenceNumber },
        select: { id: true, sourceTenderIdString: true },
      });
      try {
        const snapshot = await fetchEtimadTenderDetail(stored.sourceTenderIdString);
        const detail = parseEtimadTenderDetail(snapshot);
        await persistTenderDetail(db, stored.id, snapshot, detail, now);
        enrichedCount += 1;
      } catch (error) {
        enrichmentErrorCount += 1;
        await db.tender.update({
          where: { id: stored.id },
          data: {
            detailEnrichmentStatus: "failed",
            detailEnrichmentError:
              error instanceof Error ? error.message : String(error),
          },
        });
      }
    }

    const affectedTenderIds = await db.tender.findMany({
      where: {
        referenceNumber: {
          in: affected.map((tender) => tender.referenceNumber),
        },
      },
      select: { id: true },
    });
    await automaticallyTranslateTenders(
      db,
      affectedTenderIds.map((tender) => tender.id),
      affectedTenderIds.length,
    );
    await translateTenderMetadata(db);

    const profile = await db.companyProfile.findUnique({
      where: { id: companyProfileId },
    });
    let notificationCount = 0;

    if (profile) {
      const tenderSelect = {
        id: true,
        referenceNumber: true,
        titleArabic: true,
        descriptionArabic: true,
        agencyNameArabic: true,
        activityNameArabic: true,
        classificationFieldArabic: true,
        executionRegionArabic: true,
        tenderTypeNameArabic: true,
        submissionDeadline: true,
        detailEnrichmentStatus: true,
        sourcePayload: true,
      } satisfies Prisma.TenderSelect;
      const affectedRecords = (await db.tender.findMany({
        where: { referenceNumber: { in: affected.map((tender) => tender.referenceNumber) } },
        select: tenderSelect,
      })) as NotificationTender[];
      const newReferences = new Set(
        changes.newTenders.map((tender) => tender.referenceNumber),
      );
      const matchDrafts = affectedRecords.flatMap((tender) => {
        const draft = buildMatchNotification(
          profile,
          tender,
          newReferences.has(tender.referenceNumber) ? "new" : "updated",
          profile.notificationRelevanceThreshold,
          tenderVersionKey(tender.sourcePayload),
          now,
        );
        return draft ? [draft] : [];
      });

      const reminderEnd = new Date(
        now.getTime() + profile.deadlineReminderDays * 24 * 60 * 60 * 1_000,
      );
      const reminderCandidates = (await db.tender.findMany({
        where: {
          submissionDeadline: { gte: now, lte: reminderEnd },
          decisions: { none: { workspaceId, status: "IGNORED" } },
        },
        select: tenderSelect,
      })) as NotificationTender[];
      const reminderDrafts = reminderCandidates.flatMap((tender) => {
        const draft = buildDeadlineReminder(
          profile,
          tender,
          profile.notificationRelevanceThreshold,
          profile.deadlineReminderDays,
          now,
        );
        return draft ? [draft] : [];
      });
      const drafts = [...matchDrafts, ...reminderDrafts];

      if (drafts.length > 0) {
        const result = await db.notification.createMany({
          data: drafts.map((draft) => ({
            ...draft,
            companyProfileId: profile.id,
            monitoringRunId: run.id,
          })),
          skipDuplicates: true,
        });
        notificationCount += result.count;
      }

      const period = digestPeriodKey(profile.digestFrequency, now);
      if (period && notificationCount > 0) {
        const digest = await db.notification.createMany({
          data: [{
            uniqueKey: `DIGEST:${profile.id}:${period}`,
            companyProfileId: profile.id,
            monitoringRunId: run.id,
            type: "DIGEST",
            title: `${profile.digestFrequency === "WEEKLY" ? "Weekly" : "Daily"} tender digest`,
            body: `${notificationCount} new tender notification${notificationCount === 1 ? "" : "s"} were created during this monitoring period.`,
            reasons: [],
          }],
          skipDuplicates: true,
        });
        notificationCount += digest.count;
      }

      if (enrichmentErrorCount > 0) {
        const alert = await db.notification.createMany({
          data: [{
            uniqueKey: `MONITORING_WARNING:${run.id}`,
            companyProfileId: profile.id,
            monitoringRunId: run.id,
            type: "MONITORING_WARNING",
            title: "Some tender details could not be enriched",
            body: `${enrichmentErrorCount} affected tender detail request${enrichmentErrorCount === 1 ? "" : "s"} failed. List data was still imported.`,
            reasons: [],
          }],
          skipDuplicates: true,
        });
        notificationCount += alert.count;
      }
    }

    return db.monitoringRun.update({
      where: { id: run.id },
      data: {
        status: enrichmentErrorCount > 0 ? "completed_with_warnings" : "complete",
        pagesFetched: pages.pagesFetched,
        recordsFetched: incoming.length,
        newTenderCount: changes.newTenders.length,
        changedTenderCount: changes.changedTenders.length,
        unchangedTenderCount: changes.unchangedTenders.length,
        enrichedCount,
        enrichmentErrorCount,
        notificationCount,
        completedAt: new Date(),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await db.monitoringRun.update({
      where: { id: run.id },
      data: { status: "failed", errorMessage: message, completedAt: new Date() },
    });
    const profile = await db.companyProfile.findUnique({
      where: { id: companyProfileId },
      select: { id: true },
    });
    if (profile) {
      await db.notification.create({
        data: {
          uniqueKey: `MONITORING_ERROR:${run.id}`,
          companyProfileId: profile.id,
          monitoringRunId: run.id,
          type: "MONITORING_ERROR",
          title: "Tender monitoring failed",
          body: message,
        },
      });
    }
    throw error;
  }
}
