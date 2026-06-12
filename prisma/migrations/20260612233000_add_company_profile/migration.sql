-- CreateTable
CREATE TABLE "CompanyProfile" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "services" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "activities" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "industries" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "targetGovernmentEntities" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "regions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "preferredKeywords" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "excludedKeywords" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "preferredOpportunityTypes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyProfile_pkey" PRIMARY KEY ("id")
);
