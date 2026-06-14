-- CreateTable
CREATE TABLE "TenderAiMatchRun" (
    "id" TEXT NOT NULL,
    "companyProfileId" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "openaiResponseId" TEXT,
    "candidateCount" INTEGER NOT NULL,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "totalTokens" INTEGER,
    "estimatedCostUsd" DECIMAL(12,6),
    "sourceCompanyProfileUpdatedAt" TIMESTAMP(3) NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TenderAiMatchRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenderAiMatch" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "tenderId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "relevanceScore" INTEGER NOT NULL,
    "whyMatches" TEXT[] NOT NULL,
    "whyMayNotMatch" TEXT[] NOT NULL,
    "whatToCheckNext" TEXT[] NOT NULL,
    "recommendedAction" TEXT NOT NULL,
    "confidence" TEXT NOT NULL,
    "deterministicScore" INTEGER NOT NULL,
    "sourceTenderUpdatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenderAiMatch_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TenderAiMatchRun_companyProfileId_generatedAt_idx"
ON "TenderAiMatchRun"("companyProfileId", "generatedAt");

CREATE UNIQUE INDEX "TenderAiMatch_runId_tenderId_key"
ON "TenderAiMatch"("runId", "tenderId");

CREATE UNIQUE INDEX "TenderAiMatch_runId_rank_key"
ON "TenderAiMatch"("runId", "rank");

CREATE INDEX "TenderAiMatch_tenderId_idx"
ON "TenderAiMatch"("tenderId");

ALTER TABLE "TenderAiMatchRun"
ADD CONSTRAINT "TenderAiMatchRun_companyProfileId_fkey"
FOREIGN KEY ("companyProfileId") REFERENCES "CompanyProfile"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TenderAiMatch"
ADD CONSTRAINT "TenderAiMatch_runId_fkey"
FOREIGN KEY ("runId") REFERENCES "TenderAiMatchRun"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TenderAiMatch"
ADD CONSTRAINT "TenderAiMatch_tenderId_fkey"
FOREIGN KEY ("tenderId") REFERENCES "Tender"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
