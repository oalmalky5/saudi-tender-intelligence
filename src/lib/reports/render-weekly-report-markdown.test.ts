import assert from "node:assert/strict";
import test from "node:test";

import { renderWeeklyReportMarkdown } from "./render-weekly-report-markdown";

test("renders validated tender links into Markdown", () => {
  const markdown = renderWeeklyReportMarkdown(
    {
      executiveSummary: "Summary",
      marketSignals: [],
      recommendedActions: ["Review"],
      limitations: ["Public data only"],
      tenderReviews: [
        {
          tenderId: "tender-1",
          categories: ["TOP_RELEVANT"],
          relevanceScore: 75,
          rationale: "Relevant",
          risks: [],
          recommendedAction: "Review",
        },
      ],
    },
    "Catalyft",
    new Date("2026-06-06T00:00:00.000Z"),
    new Date("2026-06-13T00:00:00.000Z"),
    [
      {
        id: "tender-1",
        referenceNumber: "REF-1",
        titleArabic: "عنوان",
        titleEnglish: "Innovation tender",
      },
    ],
  );

  assert.match(markdown, /# Weekly Tender Report: Catalyft/);
  assert.match(markdown, /\[REF-1: Innovation tender\]\(\/tenders\/tender-1\)/);
});
