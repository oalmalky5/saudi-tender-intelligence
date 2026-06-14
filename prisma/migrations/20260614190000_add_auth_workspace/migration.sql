CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Workspace" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Workspace_userId_key" ON "Workspace"("userId");

ALTER TABLE "Workspace"
ADD CONSTRAINT "Workspace_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "User" ("id", "email", "name", "passwordHash", "updatedAt")
VALUES (
  'primary-user',
  'demo@etimad.local',
  'Demo User',
  'pending-demo-seed',
  CURRENT_TIMESTAMP
);

INSERT INTO "Workspace" ("id", "userId", "name", "isDemo", "updatedAt")
VALUES (
  'primary-workspace',
  'primary-user',
  'Catalyft Demo Workspace',
  true,
  CURRENT_TIMESTAMP
);

ALTER TABLE "CompanyProfile" ADD COLUMN "workspaceId" TEXT;
UPDATE "CompanyProfile" SET "workspaceId" = 'primary-workspace';
ALTER TABLE "CompanyProfile" ALTER COLUMN "workspaceId" SET NOT NULL;
CREATE UNIQUE INDEX "CompanyProfile_workspaceId_key" ON "CompanyProfile"("workspaceId");
ALTER TABLE "CompanyProfile"
ADD CONSTRAINT "CompanyProfile_workspaceId_fkey"
FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TenderDecision" ADD COLUMN "workspaceId" TEXT;
UPDATE "TenderDecision" SET "workspaceId" = 'primary-workspace';
ALTER TABLE "TenderDecision" ALTER COLUMN "workspaceId" SET NOT NULL;
DROP INDEX "TenderDecision_tenderId_key";
CREATE UNIQUE INDEX "TenderDecision_workspaceId_tenderId_key"
ON "TenderDecision"("workspaceId", "tenderId");
CREATE INDEX "TenderDecision_workspaceId_status_idx"
ON "TenderDecision"("workspaceId", "status");
ALTER TABLE "TenderDecision"
ADD CONSTRAINT "TenderDecision_workspaceId_fkey"
FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TenderBooklet" ADD COLUMN "workspaceId" TEXT;
UPDATE "TenderBooklet" SET "workspaceId" = 'primary-workspace';
ALTER TABLE "TenderBooklet" ALTER COLUMN "workspaceId" SET NOT NULL;
DROP INDEX "TenderBooklet_tenderId_sha256_key";
CREATE UNIQUE INDEX "TenderBooklet_workspaceId_tenderId_sha256_key"
ON "TenderBooklet"("workspaceId", "tenderId", "sha256");
CREATE INDEX "TenderBooklet_workspaceId_createdAt_idx"
ON "TenderBooklet"("workspaceId", "createdAt");
ALTER TABLE "TenderBooklet"
ADD CONSTRAINT "TenderBooklet_workspaceId_fkey"
FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CsvImportSession" ADD COLUMN "workspaceId" TEXT;
UPDATE "CsvImportSession" SET "workspaceId" = 'primary-workspace';
ALTER TABLE "CsvImportSession" ALTER COLUMN "workspaceId" SET NOT NULL;
CREATE INDEX "CsvImportSession_workspaceId_createdAt_idx"
ON "CsvImportSession"("workspaceId", "createdAt");
ALTER TABLE "CsvImportSession"
ADD CONSTRAINT "CsvImportSession_workspaceId_fkey"
FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MonitoringRun" ADD COLUMN "workspaceId" TEXT;
UPDATE "MonitoringRun" SET "workspaceId" = 'primary-workspace';
ALTER TABLE "MonitoringRun" ALTER COLUMN "workspaceId" SET NOT NULL;
CREATE INDEX "MonitoringRun_workspaceId_startedAt_idx"
ON "MonitoringRun"("workspaceId", "startedAt");
ALTER TABLE "MonitoringRun"
ADD CONSTRAINT "MonitoringRun_workspaceId_fkey"
FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TenderAiSummary" ADD COLUMN "workspaceId" TEXT;
UPDATE "TenderAiSummary" SET "workspaceId" = 'primary-workspace';
ALTER TABLE "TenderAiSummary" ALTER COLUMN "workspaceId" SET NOT NULL;
CREATE INDEX "TenderAiSummary_workspaceId_generatedAt_idx"
ON "TenderAiSummary"("workspaceId", "generatedAt");
ALTER TABLE "TenderAiSummary"
ADD CONSTRAINT "TenderAiSummary_workspaceId_fkey"
FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TenderChatRun" ADD COLUMN "workspaceId" TEXT;
UPDATE "TenderChatRun" SET "workspaceId" = 'primary-workspace';
ALTER TABLE "TenderChatRun" ALTER COLUMN "workspaceId" SET NOT NULL;
CREATE INDEX "TenderChatRun_workspaceId_generatedAt_idx"
ON "TenderChatRun"("workspaceId", "generatedAt");
ALTER TABLE "TenderChatRun"
ADD CONSTRAINT "TenderChatRun_workspaceId_fkey"
FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
