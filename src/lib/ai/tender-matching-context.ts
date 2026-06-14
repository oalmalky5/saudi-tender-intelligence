import type { TenderMatch } from "@/lib/matching/score-tender";

type CompanyProfileInput = {
  companyName: string;
  summary: string;
  services: string[];
  activities: string[];
  industries: string[];
  targetGovernmentEntities: string[];
  regions: string[];
  preferredKeywords: string[];
  excludedKeywords: string[];
  preferredOpportunityTypes: string[];
};

export type TenderMatchingCandidate = {
  id: string;
  referenceNumber: string;
  titleArabic: string;
  titleEnglish: string | null;
  descriptionArabic: string | null;
  descriptionEnglish: string | null;
  agencyNameArabic: string;
  branchNameArabic: string | null;
  tenderTypeNameArabic: string;
  tenderStatusNameArabic: string | null;
  activityNameArabic: string | null;
  classificationFieldArabic: string | null;
  executionRegionArabic: string | null;
  executionCityArabic: string | null;
  publishedAt: Date;
  submissionDeadline: Date | null;
  detailEnrichmentStatus: string;
  updatedAt: Date;
  deterministicMatch: TenderMatch;
};

export function buildTenderMatchingContext(
  profile: CompanyProfileInput,
  candidates: TenderMatchingCandidate[],
) {
  return {
    purpose:
      "Rank public tender candidates by relevance to the company profile. Relevance is not eligibility.",
    companyProfile: {
      companyName: profile.companyName,
      summary: profile.summary,
      services: profile.services,
      activities: profile.activities,
      industries: profile.industries,
      targetGovernmentEntities: profile.targetGovernmentEntities,
      regions: profile.regions,
      preferredKeywords: profile.preferredKeywords,
      excludedKeywords: profile.excludedKeywords,
      preferredOpportunityTypes: profile.preferredOpportunityTypes,
    },
    candidates: candidates.map((candidate) => ({
      tenderId: candidate.id,
      referenceNumber: candidate.referenceNumber,
      titleArabic: candidate.titleArabic,
      titleEnglish: candidate.titleEnglish,
      descriptionArabic: candidate.descriptionArabic,
      descriptionEnglish: candidate.descriptionEnglish,
      agencyNameArabic: candidate.agencyNameArabic,
      branchNameArabic: candidate.branchNameArabic,
      tenderTypeNameArabic: candidate.tenderTypeNameArabic,
      tenderStatusNameArabic: candidate.tenderStatusNameArabic,
      activityNameArabic: candidate.activityNameArabic,
      classificationFieldArabic: candidate.classificationFieldArabic,
      executionRegionArabic: candidate.executionRegionArabic,
      executionCityArabic: candidate.executionCityArabic,
      publishedAt: candidate.publishedAt.toISOString(),
      submissionDeadline: candidate.submissionDeadline?.toISOString() ?? null,
      detailEnrichmentStatus: candidate.detailEnrichmentStatus,
      deterministicMatch: candidate.deterministicMatch,
    })),
  };
}
