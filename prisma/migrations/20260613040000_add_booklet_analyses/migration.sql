-- CreateTable
CREATE TABLE "TenderBookletAnalysis" (
    "id" TEXT NOT NULL,
    "bookletId" TEXT NOT NULL,
    "companyProfileId" TEXT,
    "content" JSONB NOT NULL,
    "model" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "schemaVersion" TEXT NOT NULL,
    "openaiResponseId" TEXT,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "totalTokens" INTEGER,
    "estimatedCostUsd" DECIMAL(12,6),
    "sourceBookletSha256" TEXT NOT NULL,
    "sourceCompanyProfileUpdatedAt" TIMESTAMP(3),
    "analyzedPageNumbers" INTEGER[] NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TenderBookletAnalysis_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TenderBookletAnalysis_bookletId_generatedAt_idx"
ON "TenderBookletAnalysis"("bookletId", "generatedAt");

CREATE INDEX "TenderBookletAnalysis_companyProfileId_idx"
ON "TenderBookletAnalysis"("companyProfileId");

ALTER TABLE "TenderBookletAnalysis"
ADD CONSTRAINT "TenderBookletAnalysis_bookletId_fkey"
FOREIGN KEY ("bookletId") REFERENCES "TenderBooklet"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TenderBookletAnalysis"
ADD CONSTRAINT "TenderBookletAnalysis_companyProfileId_fkey"
FOREIGN KEY ("companyProfileId") REFERENCES "CompanyProfile"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
