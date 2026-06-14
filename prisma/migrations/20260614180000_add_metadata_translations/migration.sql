-- CreateTable
CREATE TABLE "TenderMetadataTranslation" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "sourceText" TEXT NOT NULL,
    "englishText" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'AZURE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenderMetadataTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TenderMetadataTranslation_category_sourceText_key"
ON "TenderMetadataTranslation"("category", "sourceText");

-- CreateIndex
CREATE INDEX "TenderMetadataTranslation_category_englishText_idx"
ON "TenderMetadataTranslation"("category", "englishText");
