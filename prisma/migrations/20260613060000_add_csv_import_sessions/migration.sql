-- CreateTable
CREATE TABLE "CsvImportSession" (
    "id" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "headerMapping" JSONB NOT NULL,
    "rows" JSONB NOT NULL,
    "totalRows" INTEGER NOT NULL,
    "validRows" INTEGER NOT NULL,
    "invalidRows" INTEGER NOT NULL,
    "duplicateRows" INTEGER NOT NULL,
    "createdCount" INTEGER,
    "updatedCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "CsvImportSession_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CsvImportSession_createdAt_idx" ON "CsvImportSession"("createdAt");
