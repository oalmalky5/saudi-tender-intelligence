-- AlterTable
ALTER TABLE "Tender"
ADD COLUMN "detailEnrichmentStatus" TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN "detailEnrichmentError" TEXT;

-- CreateTable
CREATE TABLE "TenderDetailSnapshot" (
    "id" TEXT NOT NULL,
    "tenderId" TEXT NOT NULL,
    "basicHtml" TEXT NOT NULL,
    "datesHtml" TEXT NOT NULL,
    "relationsHtml" TEXT NOT NULL,
    "attachmentsHtml" TEXT NOT NULL,
    "localContentHtml" TEXT NOT NULL,
    "awardingHtml" TEXT NOT NULL,
    "parsedPayload" JSONB NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenderDetailSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TenderDetailSnapshot_tenderId_key"
ON "TenderDetailSnapshot"("tenderId");

-- AddForeignKey
ALTER TABLE "TenderDetailSnapshot"
ADD CONSTRAINT "TenderDetailSnapshot_tenderId_fkey"
FOREIGN KEY ("tenderId") REFERENCES "Tender"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "TenderAttachment" (
    "id" TEXT NOT NULL,
    "tenderId" TEXT NOT NULL,
    "sourceAttachmentKey" TEXT NOT NULL,
    "nameArabic" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenderAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TenderAttachment_tenderId_sourceAttachmentKey_key"
ON "TenderAttachment"("tenderId", "sourceAttachmentKey");

-- AddForeignKey
ALTER TABLE "TenderAttachment"
ADD CONSTRAINT "TenderAttachment_tenderId_fkey"
FOREIGN KEY ("tenderId") REFERENCES "Tender"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
