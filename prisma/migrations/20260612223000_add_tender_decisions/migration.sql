-- CreateEnum
CREATE TYPE "TenderDecisionStatus" AS ENUM ('SAVED', 'IGNORED');

-- CreateTable
CREATE TABLE "TenderDecision" (
    "id" TEXT NOT NULL,
    "tenderId" TEXT NOT NULL,
    "status" "TenderDecisionStatus",
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenderDecision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TenderDecision_tenderId_key"
ON "TenderDecision"("tenderId");

-- CreateIndex
CREATE INDEX "TenderDecision_status_idx"
ON "TenderDecision"("status");

-- AddForeignKey
ALTER TABLE "TenderDecision"
ADD CONSTRAINT "TenderDecision_tenderId_fkey"
FOREIGN KEY ("tenderId") REFERENCES "Tender"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
