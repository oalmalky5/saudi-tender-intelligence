# Weekly Tender Reports

Milestone 14 provides the primary weekly decision-brief workflow.

## Generate from the App

Open:

```text
http://localhost:3000/reports/weekly
```

Select a date range of up to 31 days and use **Generate Weekly Tender Report**.

## Generate from the Terminal

```bash
npm run report:weekly
```

The command and web button use the same report-generation service.

## Report Pipeline

1. Require the primary company profile.
2. Curate at most 20 tender candidates using saved state, deterministic
   relevance, deadlines, report dates, and recency.
3. Make one bounded `gpt-5-mini` request.
4. Validate the structured response and reject unknown tender references or
   eligibility overclaims.
5. Generate Markdown locally so tender links cannot be invented by the model.
6. Store the report, source versions, model metadata, token usage, and
   estimated cost.

## Current Limits

- Reports use stored public data and cannot assess hidden or purchased booklet
  requirements unless those documents have separately been uploaded and
  analyzed.
- A company profile is required.
- PDF and Word export are deferred.

## Live Evaluation

### 2026-06-14 — Catalyft no-match report

- The report reviewed 20 curated candidates and explicitly concluded that none
  requested work Catalyft plausibly delivers.
- Six tenders remained in the report only as `IGNORE`, `HIGH_RISK`, or
  `CLOSING_SOON` market-awareness items; none were presented as a matching
  opportunity.
- The report clearly separated scope relevance from eligibility and disclosed
  incomplete public-data limitations.
- The run used 7,794 tokens and cost approximately `$0.005478`.
