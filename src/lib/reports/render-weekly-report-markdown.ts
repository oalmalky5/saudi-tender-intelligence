import type { WeeklyTenderReportContent } from "@/lib/ai/weekly-report-schema";

type TenderLink = {
  id: string;
  referenceNumber: string;
  titleArabic: string;
  titleEnglish: string | null;
};

function list(items: string[]): string {
  return items.length > 0 ? items.map((item) => `- ${item}`).join("\n") : "- None";
}

export function renderWeeklyReportMarkdown(
  content: WeeklyTenderReportContent,
  companyName: string,
  dateFrom: Date,
  dateTo: Date,
  tenders: TenderLink[],
): string {
  const tenderById = new Map(tenders.map((tender) => [tender.id, tender]));
  const reviews = content.tenderReviews
    .map((review) => {
      const tender = tenderById.get(review.tenderId);
      if (!tender) {
        return "";
      }
      const title = tender.titleEnglish ?? tender.titleArabic;
      return [
        `### [${tender.referenceNumber}: ${title}](/tenders/${tender.id})`,
        `**Categories:** ${review.categories.join(", ").replaceAll("_", " ")}`,
        `**Relevance:** ${review.relevanceScore}%`,
        "",
        review.rationale,
        "",
        "**Risks**",
        list(review.risks),
        "",
        `**Recommended action:** ${review.recommendedAction}`,
      ].join("\n");
    })
    .filter(Boolean)
    .join("\n\n");

  return [
    `# Weekly Tender Report: ${companyName}`,
    "",
    `**Period:** ${dateFrom.toISOString().slice(0, 10)} to ${dateTo.toISOString().slice(0, 10)} (Riyadh time)`,
    "",
    "## Executive Summary",
    content.executiveSummary,
    "",
    "## Market Signals",
    list(content.marketSignals),
    "",
    "## Recommended Actions",
    list(content.recommendedActions),
    "",
    "## Tender Reviews",
    reviews,
    "",
    "## Limitations",
    list(content.limitations),
  ].join("\n");
}
