CREATE TABLE "WeeklyTenderReport" (
    "id" TEXT NOT NULL,
    "companyProfileId" TEXT NOT NULL,
    "dateFrom" TIMESTAMP(3) NOT NULL,
    "dateTo" TIMESTAMP(3) NOT NULL,
    "content" JSONB NOT NULL,
    "markdown" TEXT NOT NULL,
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

    CONSTRAINT "WeeklyTenderReport_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WeeklyTenderReportTender" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "tenderId" TEXT NOT NULL,
    "categories" TEXT[],
    "sourceTenderUpdatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeeklyTenderReportTender_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WeeklyTenderReport_companyProfileId_generatedAt_idx" ON "WeeklyTenderReport"("companyProfileId", "generatedAt");
CREATE INDEX "WeeklyTenderReport_dateFrom_dateTo_idx" ON "WeeklyTenderReport"("dateFrom", "dateTo");
CREATE UNIQUE INDEX "WeeklyTenderReportTender_reportId_tenderId_key" ON "WeeklyTenderReportTender"("reportId", "tenderId");
CREATE INDEX "WeeklyTenderReportTender_tenderId_idx" ON "WeeklyTenderReportTender"("tenderId");

ALTER TABLE "WeeklyTenderReport"
ADD CONSTRAINT "WeeklyTenderReport_companyProfileId_fkey"
FOREIGN KEY ("companyProfileId") REFERENCES "CompanyProfile"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WeeklyTenderReportTender"
ADD CONSTRAINT "WeeklyTenderReportTender_reportId_fkey"
FOREIGN KEY ("reportId") REFERENCES "WeeklyTenderReport"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WeeklyTenderReportTender"
ADD CONSTRAINT "WeeklyTenderReportTender_tenderId_fkey"
FOREIGN KEY ("tenderId") REFERENCES "Tender"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
