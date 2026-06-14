CREATE TABLE "GovernmentAgency" (
    "agencyCode" TEXT NOT NULL,
    "govAgencyCode" INTEGER NOT NULL,
    "nameArabic" TEXT NOT NULL,
    "isOldSystem" BOOLEAN NOT NULL DEFAULT false,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GovernmentAgency_pkey" PRIMARY KEY ("agencyCode")
);

CREATE INDEX "GovernmentAgency_nameArabic_idx" ON "GovernmentAgency"("nameArabic");
CREATE INDEX "GovernmentAgency_isOldSystem_idx" ON "GovernmentAgency"("isOldSystem");
