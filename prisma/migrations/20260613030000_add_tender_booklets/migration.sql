-- CreateTable
CREATE TABLE "TenderBooklet" (
    "id" TEXT NOT NULL,
    "tenderId" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "storedPath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,
    "pageCount" INTEGER NOT NULL,
    "extractedCharacters" INTEGER NOT NULL,
    "extractionStatus" TEXT NOT NULL,
    "extractionMethod" TEXT NOT NULL,
    "requiresOcr" BOOLEAN NOT NULL DEFAULT false,
    "extractionError" TEXT,
    "extractedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TenderBooklet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenderBookletPage" (
    "id" TEXT NOT NULL,
    "bookletId" TEXT NOT NULL,
    "pageNumber" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "characterCount" INTEGER NOT NULL,

    CONSTRAINT "TenderBookletPage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TenderBooklet_tenderId_sha256_key"
ON "TenderBooklet"("tenderId", "sha256");

CREATE INDEX "TenderBooklet_tenderId_createdAt_idx"
ON "TenderBooklet"("tenderId", "createdAt");

CREATE UNIQUE INDEX "TenderBookletPage_bookletId_pageNumber_key"
ON "TenderBookletPage"("bookletId", "pageNumber");

ALTER TABLE "TenderBooklet"
ADD CONSTRAINT "TenderBooklet_tenderId_fkey"
FOREIGN KEY ("tenderId") REFERENCES "Tender"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TenderBookletPage"
ADD CONSTRAINT "TenderBookletPage_bookletId_fkey"
FOREIGN KEY ("bookletId") REFERENCES "TenderBooklet"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
