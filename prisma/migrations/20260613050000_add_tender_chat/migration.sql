-- CreateTable
CREATE TABLE "TenderChatRun" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "retrieval" JSONB NOT NULL,
    "companyProfileId" TEXT,
    "model" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "openaiResponseId" TEXT,
    "retrievedTenderCount" INTEGER NOT NULL,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "totalTokens" INTEGER,
    "estimatedCostUsd" DECIMAL(12,6),
    "sourceCompanyProfileUpdatedAt" TIMESTAMP(3),
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TenderChatRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenderChatCitation" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "tenderId" TEXT NOT NULL,
    "claim" TEXT NOT NULL,

    CONSTRAINT "TenderChatCitation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TenderChatRun_generatedAt_idx" ON "TenderChatRun"("generatedAt");
CREATE INDEX "TenderChatRun_companyProfileId_idx" ON "TenderChatRun"("companyProfileId");
CREATE INDEX "TenderChatCitation_runId_idx" ON "TenderChatCitation"("runId");
CREATE INDEX "TenderChatCitation_tenderId_idx" ON "TenderChatCitation"("tenderId");

ALTER TABLE "TenderChatRun"
ADD CONSTRAINT "TenderChatRun_companyProfileId_fkey"
FOREIGN KEY ("companyProfileId") REFERENCES "CompanyProfile"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "TenderChatCitation"
ADD CONSTRAINT "TenderChatCitation_runId_fkey"
FOREIGN KEY ("runId") REFERENCES "TenderChatRun"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TenderChatCitation"
ADD CONSTRAINT "TenderChatCitation_tenderId_fkey"
FOREIGN KEY ("tenderId") REFERENCES "Tender"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
