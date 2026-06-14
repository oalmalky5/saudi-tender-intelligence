import {
  scoreTenderMatch,
  type MatchProfile,
  type MatchTender,
  type TenderMatch,
} from "@/lib/matching/score-tender";

export type WeeklyReportTender = MatchTender & {
  id: string;
  referenceNumber: string;
  titleEnglish: string | null;
  descriptionEnglish: string | null;
  tenderStatusNameArabic: string | null;
  publishedAt: Date;
  updatedAt: Date;
  decision: { status: string | null; note: string | null } | null;
};

export type WeeklyReportCandidate = WeeklyReportTender & {
  deterministicMatch: TenderMatch;
};

export function selectWeeklyReportCandidates(
  profile: MatchProfile,
  tenders: WeeklyReportTender[],
  dateFrom: Date,
  dateTo: Date,
  now = new Date(),
  limit = 20,
): WeeklyReportCandidate[] {
  const closingWindowEnd = new Date(
    Math.max(dateTo.getTime(), now.getTime() + 7 * 24 * 60 * 60 * 1_000),
  );

  return tenders
    .map((tender) => ({
      ...tender,
      deterministicMatch: scoreTenderMatch(profile, tender, now),
    }))
    .sort((left, right) => {
      const leftSaved = left.decision?.status === "SAVED" ? 1 : 0;
      const rightSaved = right.decision?.status === "SAVED" ? 1 : 0;
      const leftDirect = left.deterministicMatch.hasDirectScopeMatch ? 1 : 0;
      const rightDirect = right.deterministicMatch.hasDirectScopeMatch ? 1 : 0;
      const leftPublished =
        left.publishedAt >= dateFrom && left.publishedAt <= dateTo ? 1 : 0;
      const rightPublished =
        right.publishedAt >= dateFrom && right.publishedAt <= dateTo ? 1 : 0;
      const leftClosing =
        left.submissionDeadline &&
        left.submissionDeadline >= now &&
        left.submissionDeadline <= closingWindowEnd
          ? 1
          : 0;
      const rightClosing =
        right.submissionDeadline &&
        right.submissionDeadline >= now &&
        right.submissionDeadline <= closingWindowEnd
          ? 1
          : 0;

      return (
        rightSaved - leftSaved ||
        rightDirect - leftDirect ||
        right.deterministicMatch.score - left.deterministicMatch.score ||
        rightClosing - leftClosing ||
        rightPublished - leftPublished ||
        right.publishedAt.getTime() - left.publishedAt.getTime()
      );
    })
    .slice(0, limit);
}

type CompanyProfileInput = MatchProfile & {
  companyName: string;
  summary: string;
};

export function buildWeeklyReportContext(
  profile: CompanyProfileInput,
  candidates: WeeklyReportCandidate[],
  dateFrom: Date,
  dateTo: Date,
) {
  return {
    purpose:
      "Create an English weekly tender intelligence report using only these curated database records. Relevance is not eligibility.",
    reportPeriod: {
      dateFrom: dateFrom.toISOString(),
      dateTo: dateTo.toISOString(),
      timeZone: "Asia/Riyadh",
    },
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
      tenderTypeNameArabic: candidate.tenderTypeNameArabic,
      tenderStatusNameArabic: candidate.tenderStatusNameArabic,
      activityNameArabic: candidate.activityNameArabic,
      classificationFieldArabic: candidate.classificationFieldArabic,
      executionRegionArabic: candidate.executionRegionArabic,
      publishedAt: candidate.publishedAt.toISOString(),
      submissionDeadline: candidate.submissionDeadline?.toISOString() ?? null,
      detailEnrichmentStatus: candidate.detailEnrichmentStatus,
      workspaceDecision: candidate.decision,
      deterministicMatch: candidate.deterministicMatch,
    })),
  };
}
