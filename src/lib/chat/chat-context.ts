export function buildTenderChatContext(
  question: string,
  retrieval: unknown,
  tenders: Array<Record<string, unknown>>,
  companyProfile: Record<string, unknown> | null,
) {
  return {
    question,
    retrieval,
    companyProfile,
    sourceRules: {
      tenderIdIsCitationKey: true,
      tenderIdMustNotAppearInAnswerProse: true,
      missingDataMeansUnknown: true,
      sourceTimezone: "Asia/Riyadh",
      retrievedTenderLimit: 20,
      resultMayBeNonExhaustiveWhenLimitReached: tenders.length === 20,
      companyFitMeansDirectDeliveryScope: true,
      indirectBidderSupportDoesNotCountAsFit: true,
      noCredibleMatchesIsValid: true,
    },
    tenders: tenders.map((tender) => ({
      ...tender,
      documentPrice:
        tender.documentPrice && typeof tender.documentPrice === "object"
          ? String(tender.documentPrice)
          : tender.documentPrice,
      finalGuaranteePercentage:
        tender.finalGuaranteePercentage &&
        typeof tender.finalGuaranteePercentage === "object"
          ? String(tender.finalGuaranteePercentage)
          : tender.finalGuaranteePercentage,
    })),
  };
}
