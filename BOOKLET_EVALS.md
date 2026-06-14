# Milestone 10 Booklet Analysis Evaluation Checklist

Booklet analysis is a deliberate post-discovery workflow. The original PDF is
uploaded manually, preserved locally, extracted locally, and analyzed only
after the user sees the estimated API cost.

## Local Extraction Review

Upload the representative `MHRSD - Innovation Center (Ar).pdf` through a
tender detail page.

Before making an AI request, verify:

- The stored filename, size, SHA-256 hash, and page count are correct.
- Re-uploading the unchanged PDF does not repeat extraction.
- Arabic page previews are readable.
- Extracted page numbers match the original PDF.
- The OCR warning appears if the average extracted page text is too sparse.
- The estimated analysis cost and selected-page count are visible.

The current environment cannot programmatically read the fixture while it
remains in macOS `Downloads`; upload it through the app or move it into the
project workspace for the first extraction evaluation.

## Cited AI Analysis Review

After extraction is confirmed, explicitly start one paid analysis and verify:

- Executive summary findings are useful and grounded.
- Scope and deliverables are tender-specific.
- Eligibility requirements are confirmed requirements, not assumptions.
- Required licenses, certificates, and documents are identified.
- Staffing, qualifications, and language requirements are identified.
- Submission and evaluation criteria are identified.
- Guarantees, penalties, risks, and local-content requirements are identified.
- Standard boilerplate is separated from tender-specific terms.
- Company-fit notes discuss relevance and gaps without claiming compliance.
- Every important finding has a correct page number and exact source excerpt.
- No citation points to a page that was not supplied to the model.
- Questions identify uncertainty caused by selected-page retrieval.

## Cost Controls

- At most 30 pages and 100,000 extracted characters are sent per analysis.
- The first five pages are included, followed by keyword-relevant pages.
- Analysis is cached for the unchanged booklet, prompt, schema, and company
  profile.
- Actual token usage and estimated actual cost are stored after analysis.

## Deterministic Checks

`src/lib/ai/evaluate-booklet-analysis.ts` verifies the structured schema,
rejects obvious company eligibility overclaims, confirms that cited pages were
supplied, and requires every cited excerpt to exist verbatim in extracted page
text. Human bilingual review remains required for interpretation quality.
