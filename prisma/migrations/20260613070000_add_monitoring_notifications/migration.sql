ALTER TABLE "CompanyProfile"
ADD COLUMN "notificationRelevanceThreshold" INTEGER NOT NULL DEFAULT 40,
ADD COLUMN "deadlineReminderDays" INTEGER NOT NULL DEFAULT 7,
ADD COLUMN "digestFrequency" TEXT NOT NULL DEFAULT 'DAILY';

CREATE TABLE "MonitoringRun" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "pagesFetched" INTEGER NOT NULL DEFAULT 0,
    "recordsFetched" INTEGER NOT NULL DEFAULT 0,
    "newTenderCount" INTEGER NOT NULL DEFAULT 0,
    "changedTenderCount" INTEGER NOT NULL DEFAULT 0,
    "unchangedTenderCount" INTEGER NOT NULL DEFAULT 0,
    "enrichedCount" INTEGER NOT NULL DEFAULT 0,
    "enrichmentErrorCount" INTEGER NOT NULL DEFAULT 0,
    "notificationCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "MonitoringRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "uniqueKey" TEXT NOT NULL,
    "companyProfileId" TEXT NOT NULL,
    "tenderId" TEXT,
    "monitoringRunId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "relevanceScore" INTEGER,
    "reasons" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Notification_uniqueKey_key" ON "Notification"("uniqueKey");
CREATE INDEX "MonitoringRun_startedAt_idx" ON "MonitoringRun"("startedAt");
CREATE INDEX "MonitoringRun_status_idx" ON "MonitoringRun"("status");
CREATE INDEX "Notification_companyProfileId_createdAt_idx" ON "Notification"("companyProfileId", "createdAt");
CREATE INDEX "Notification_companyProfileId_readAt_idx" ON "Notification"("companyProfileId", "readAt");
CREATE INDEX "Notification_tenderId_idx" ON "Notification"("tenderId");

ALTER TABLE "Notification"
ADD CONSTRAINT "Notification_companyProfileId_fkey"
FOREIGN KEY ("companyProfileId") REFERENCES "CompanyProfile"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Notification"
ADD CONSTRAINT "Notification_tenderId_fkey"
FOREIGN KEY ("tenderId") REFERENCES "Tender"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Notification"
ADD CONSTRAINT "Notification_monitoringRunId_fkey"
FOREIGN KEY ("monitoringRunId") REFERENCES "MonitoringRun"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
