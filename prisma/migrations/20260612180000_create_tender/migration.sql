-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Tender" (
    "id" TEXT NOT NULL,
    "referenceNumber" TEXT NOT NULL,
    "tenderNumber" TEXT,
    "sourceTenderId" INTEGER NOT NULL,
    "sourceTenderIdString" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "sourceSystem" TEXT NOT NULL DEFAULT 'etimad',
    "titleArabic" TEXT NOT NULL,
    "titleEnglish" TEXT,
    "descriptionArabic" TEXT,
    "descriptionEnglish" TEXT,
    "agencyNameArabic" TEXT NOT NULL,
    "branchNameArabic" TEXT,
    "tenderTypeId" INTEGER NOT NULL,
    "tenderTypeNameArabic" TEXT NOT NULL,
    "tenderStatusId" INTEGER NOT NULL,
    "tenderStatusNameArabic" TEXT,
    "activityId" INTEGER,
    "activityNameArabic" TEXT,
    "classificationFieldArabic" TEXT,
    "executionRegionArabic" TEXT,
    "executionCityArabic" TEXT,
    "executionDetailsArabic" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "enquiriesDeadline" TIMESTAMP(3),
    "submissionDeadline" TIMESTAMP(3),
    "offersOpeningAt" TIMESTAMP(3),
    "expectedAwardAt" TIMESTAMP(3),
    "workStartsAt" TIMESTAMP(3),
    "contractDurationArabic" TEXT,
    "submissionMethodArabic" TEXT,
    "documentPrice" DECIMAL(12,2),
    "financialFees" DECIMAL(12,2),
    "invitationCost" DECIMAL(12,2),
    "initialGuaranteeRequired" BOOLEAN,
    "finalGuaranteePercentage" DECIMAL(5,2),
    "insuranceRequired" BOOLEAN,
    "localContentRequirementsArabic" TEXT,
    "hasInvitations" BOOLEAN,
    "isUgrp" BOOLEAN NOT NULL DEFAULT false,
    "externalSourceUrl" TEXT,
    "sourcePayload" JSONB NOT NULL,
    "detailsEnrichedAt" TIMESTAMP(3),
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tender_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tender_referenceNumber_key" ON "Tender"("referenceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Tender_sourceTenderId_key" ON "Tender"("sourceTenderId");

-- CreateIndex
CREATE INDEX "Tender_agencyNameArabic_idx" ON "Tender"("agencyNameArabic");

-- CreateIndex
CREATE INDEX "Tender_activityNameArabic_idx" ON "Tender"("activityNameArabic");

-- CreateIndex
CREATE INDEX "Tender_publishedAt_idx" ON "Tender"("publishedAt");

-- CreateIndex
CREATE INDEX "Tender_submissionDeadline_idx" ON "Tender"("submissionDeadline");
