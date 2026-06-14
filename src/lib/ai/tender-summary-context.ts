import { scoreTenderMatch } from "@/lib/matching/score-tender";

type NullableDate = Date | null;
type NullableValue = string | number | boolean | null;

export type TenderSummarySource = {
  referenceNumber: string;
  tenderNumber: string | null;
  sourceUrl: string;
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
  executionDetailsArabic: string | null;
  publishedAt: Date;
  enquiriesDeadline: NullableDate;
  submissionDeadline: NullableDate;
  offersOpeningAt: NullableDate;
  expectedAwardAt: NullableDate;
  workStartsAt: NullableDate;
  contractDurationArabic: string | null;
  submissionMethodArabic: string | null;
  documentPrice: { toString(): string } | null;
  financialFees: { toString(): string } | null;
  invitationCost: { toString(): string } | null;
  initialGuaranteeRequired: boolean | null;
  finalGuaranteePercentage: { toString(): string } | null;
  insuranceRequired: boolean | null;
  localContentRequirementsArabic: string | null;
  detailEnrichmentStatus: string;
  detailsEnrichedAt: NullableDate;
  attachments: Array<{ nameArabic: string }>;
};

export type CompanySummarySource = {
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

function knownMissingInformation(tender: TenderSummarySource): string[] {
  const missing = ["Purchased tender-document contents are unavailable."];

  if (tender.detailEnrichmentStatus !== "complete") {
    missing.push("Public tender details have not been enriched.");
  }
  if (!tender.descriptionArabic && !tender.descriptionEnglish) {
    missing.push("No public tender description is stored.");
  }
  if (!tender.enquiriesDeadline) {
    missing.push("The enquiries deadline is not publicly provided.");
  }
  if (!tender.submissionDeadline) {
    missing.push("The submission deadline is not publicly provided.");
  }
  if (!tender.offersOpeningAt) {
    missing.push("The offers-opening date is not publicly provided.");
  }
  if (!tender.expectedAwardAt) {
    missing.push("The expected-award date is not publicly provided.");
  }
  if (!tender.workStartsAt) {
    missing.push("The expected work-start date is not publicly provided.");
  }
  if (tender.initialGuaranteeRequired) {
    missing.push(
      "An initial guarantee is required, but its amount and acceptable form are not publicly provided.",
    );
  }
  if (tender.attachments.length === 0) {
    missing.push("No public attachment metadata was provided.");
  }

  return missing;
}

function iso(date: NullableDate): string | null {
  if (!date) {
    return null;
  }

  const riyadhDateTime = new Intl.DateTimeFormat("sv-SE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
    timeZone: "Asia/Riyadh",
  })
    .format(date)
    .replace(" ", "T");

  return `${riyadhDateTime}+03:00`;
}

function decimal(value: { toString(): string } | null): string | null {
  return value?.toString() ?? null;
}

function removeEmptyValues(
  value: Record<string, NullableValue | string[]>,
): Record<string, NullableValue | string[]> {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => {
      if (item === null || item === "") {
        return false;
      }

      return !Array.isArray(item) || item.length > 0;
    }),
  );
}

export function buildTenderSummaryContext(
  tender: TenderSummarySource,
  companyProfile: CompanySummarySource | null,
) {
  const companyRelevance = companyProfile
    ? scoreTenderMatch(companyProfile, tender)
    : null;

  return {
    tender: removeEmptyValues({
      referenceNumber: tender.referenceNumber,
      tenderNumber: tender.tenderNumber,
      sourceUrl: tender.sourceUrl,
      titleArabic: tender.titleArabic,
      titleEnglish: tender.titleEnglish,
      descriptionArabic: tender.descriptionArabic,
      descriptionEnglish: tender.descriptionEnglish,
      agencyNameArabic: tender.agencyNameArabic,
      branchNameArabic: tender.branchNameArabic,
      tenderTypeNameArabic: tender.tenderTypeNameArabic,
      tenderStatusNameArabic: tender.tenderStatusNameArabic,
      activityNameArabic: tender.activityNameArabic,
      classificationFieldArabic: tender.classificationFieldArabic,
      executionRegionArabic: tender.executionRegionArabic,
      executionCityArabic: tender.executionCityArabic,
      executionDetailsArabic: tender.executionDetailsArabic,
      publishedAt: iso(tender.publishedAt),
      enquiriesDeadline: iso(tender.enquiriesDeadline),
      submissionDeadline: iso(tender.submissionDeadline),
      offersOpeningAt: iso(tender.offersOpeningAt),
      expectedAwardAt: iso(tender.expectedAwardAt),
      workStartsAt: iso(tender.workStartsAt),
      contractDurationArabic: tender.contractDurationArabic,
      submissionMethodArabic: tender.submissionMethodArabic,
      documentPriceSar: decimal(tender.documentPrice),
      financialFeesSar: decimal(tender.financialFees),
      invitationCostSar: decimal(tender.invitationCost),
      initialGuaranteeRequired: tender.initialGuaranteeRequired,
      finalGuaranteePercentage: decimal(tender.finalGuaranteePercentage),
      insuranceRequired: tender.insuranceRequired,
      localContentRequirementsArabic: tender.localContentRequirementsArabic,
      detailEnrichmentStatus: tender.detailEnrichmentStatus,
      detailsEnrichedAt: iso(tender.detailsEnrichedAt),
      publicAttachmentNamesArabic: tender.attachments.map(
        (attachment) => attachment.nameArabic,
      ),
    }),
    companyProfile: companyProfile
      ? removeEmptyValues({
          companyName: companyProfile.companyName,
          summary: companyProfile.summary,
          services: companyProfile.services,
          activities: companyProfile.activities,
          industries: companyProfile.industries,
          targetGovernmentEntities: companyProfile.targetGovernmentEntities,
          regions: companyProfile.regions,
          preferredKeywords: companyProfile.preferredKeywords,
          excludedKeywords: companyProfile.excludedKeywords,
          preferredOpportunityTypes: companyProfile.preferredOpportunityTypes,
        })
      : null,
    companyRelevance,
    knownMissingInformation: knownMissingInformation(tender),
  };
}
