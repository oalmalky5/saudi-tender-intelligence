export type MatchProfile = {
  services: string[];
  activities: string[];
  industries: string[];
  targetGovernmentEntities: string[];
  regions: string[];
  preferredKeywords: string[];
  excludedKeywords: string[];
  preferredOpportunityTypes: string[];
};

export type MatchTender = {
  titleArabic: string;
  descriptionArabic: string | null;
  agencyNameArabic: string;
  activityNameArabic: string | null;
  classificationFieldArabic: string | null;
  executionRegionArabic: string | null;
  tenderTypeNameArabic: string;
  submissionDeadline: Date | null;
  detailEnrichmentStatus: string;
};

export type TenderMatch = {
  score: number;
  directScopeScore: number;
  hasDirectScopeMatch: boolean;
  reasons: string[];
  concerns: string[];
  matchedTerms: string[];
};

function normalize(value: string): string {
  return value.toLocaleLowerCase().replace(/\s+/g, " ").trim();
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function findMatchingTerms(terms: string[], text: string): string[] {
  const normalizedText = normalize(text);
  return unique(
    terms.filter((term) => {
      const normalizedTerm = normalize(term);
      if (normalizedTerm.length < 2) {
        return false;
      }
      if (/^[a-z0-9]{2,3}$/.test(normalizedTerm)) {
        const escaped = normalizedTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        return new RegExp(`(^|[^a-z0-9])${escaped}($|[^a-z0-9])`, "i").test(
          normalizedText,
        );
      }
      return normalizedText.includes(normalizedTerm);
    }),
  );
}

function matchesAny(values: string[], target: string | null): string[] {
  if (!target) {
    return [];
  }

  const normalizedTarget = normalize(target);
  return values.filter((value) => {
    const normalizedValue = normalize(value);
    return (
      normalizedValue === normalizedTarget ||
      normalizedTarget.includes(normalizedValue) ||
      normalizedValue.includes(normalizedTarget)
    );
  });
}

export function scoreTenderMatch(
  profile: MatchProfile,
  tender: MatchTender,
  now = new Date(),
): TenderMatch {
  const reasons: string[] = [];
  const concerns: string[] = [];
  let score = 0;
  let directScopeScore = 0;

  const searchableText = [
    tender.titleArabic,
    tender.descriptionArabic,
    tender.agencyNameArabic,
    tender.activityNameArabic,
    tender.classificationFieldArabic,
  ]
    .filter((value): value is string => Boolean(value))
    .join(" ");

  const activityMatches = matchesAny(profile.activities, tender.activityNameArabic);
  if (activityMatches.length > 0) {
    score += 30;
    directScopeScore += 30;
    reasons.push(`Activity matches: ${activityMatches.join(", ")}`);
  }

  const directTerms = unique([
    ...profile.preferredKeywords,
    ...profile.services,
  ]);
  const directMatchedTerms = findMatchingTerms(directTerms, searchableText);
  if (directMatchedTerms.length > 0) {
    const directTermScore = Math.min(30, directMatchedTerms.length * 10);
    score += directTermScore;
    directScopeScore += directTermScore;
    reasons.push(`Matched service/scope terms: ${directMatchedTerms.join(", ")}`);
  }

  const industryTerms = unique([
    ...profile.industries,
  ]);
  const industryMatches = findMatchingTerms(industryTerms, searchableText);
  if (industryMatches.length > 0) {
    score += Math.min(10, industryMatches.length * 5);
    reasons.push(`Industry context matches: ${industryMatches.join(", ")}`);
  }

  const entityMatches = matchesAny(
    profile.targetGovernmentEntities,
    tender.agencyNameArabic,
  );
  if (entityMatches.length > 0) {
    score += 15;
    reasons.push(`Target government entity: ${entityMatches.join(", ")}`);
  }

  const regionMatches = matchesAny(profile.regions, tender.executionRegionArabic);
  if (regionMatches.length > 0) {
    score += 10;
    reasons.push(`Preferred region: ${regionMatches.join(", ")}`);
  } else if (
    profile.regions.length > 0 &&
    tender.detailEnrichmentStatus !== "complete"
  ) {
    concerns.push("Region is unknown until public details are enriched.");
  }

  const opportunityMatches = matchesAny(
    profile.preferredOpportunityTypes,
    tender.tenderTypeNameArabic,
  );
  if (opportunityMatches.length > 0) {
    score += 5;
    reasons.push(`Preferred opportunity type: ${opportunityMatches.join(", ")}`);
  }

  if (tender.submissionDeadline) {
    const daysRemaining =
      (tender.submissionDeadline.getTime() - now.getTime()) /
      (1000 * 60 * 60 * 24);

    if (score > 0 && daysRemaining >= 7 && daysRemaining <= 30) {
      score += 10;
      reasons.push("Submission deadline is within 30 days.");
    } else if (score > 0 && daysRemaining >= 0 && daysRemaining < 7) {
      score += 5;
      concerns.push("Submission deadline is less than 7 days away.");
    } else if (daysRemaining < 0) {
      score = 0;
      concerns.push("Submission deadline has passed.");
    }
  } else {
    concerns.push("Submission deadline is not publicly provided.");
  }

  const excludedMatches = findMatchingTerms(
    profile.excludedKeywords,
    searchableText,
  );
  if (excludedMatches.length > 0) {
    score -= 60;
    concerns.push(`Excluded terms found: ${excludedMatches.join(", ")}`);
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    directScopeScore,
    hasDirectScopeMatch: directScopeScore > 0 && excludedMatches.length === 0,
    reasons,
    concerns,
    matchedTerms: unique([...directMatchedTerms, ...industryMatches]),
  };
}
