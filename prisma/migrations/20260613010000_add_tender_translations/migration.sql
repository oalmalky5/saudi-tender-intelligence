-- CreateTable
CREATE TABLE "TenderTranslation" (
    "id" TEXT NOT NULL,
    "tenderId" TEXT NOT NULL,
    "titleEnglish" TEXT NOT NULL,
    "descriptionEnglish" TEXT,
    "sourceHash" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "openaiResponseId" TEXT,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "totalTokens" INTEGER,
    "estimatedCostUsd" DECIMAL(12,6),
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TenderTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TenderTranslation_tenderId_generatedAt_idx"
ON "TenderTranslation"("tenderId", "generatedAt");

-- CreateIndex
CREATE INDEX "TenderTranslation_tenderId_sourceHash_idx"
ON "TenderTranslation"("tenderId", "sourceHash");

-- AddForeignKey
ALTER TABLE "TenderTranslation"
ADD CONSTRAINT "TenderTranslation_tenderId_fkey"
FOREIGN KEY ("tenderId") REFERENCES "Tender"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
