-- AlterTable
ALTER TABLE "TenderTranslation"
ADD COLUMN "provider" TEXT NOT NULL DEFAULT 'OPENAI',
ADD COLUMN "translationType" TEXT NOT NULL DEFAULT 'IMPROVED',
ADD COLUMN "characterCount" INTEGER;

-- CreateIndex
CREATE INDEX "TenderTranslation_provider_sourceHash_idx"
ON "TenderTranslation"("provider", "sourceHash");
