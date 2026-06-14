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

### 2026-06-14 — Representative extraction

- The representative 35-page PDF was uploaded through the application and
  registered locally.
- Local extraction produced 62,193 readable characters without requiring OCR.
- A detached-`Uint8Array` bug initially caused post-extraction hashing and size
  checks to see an empty file. Passing a copy to `pdfjs` fixed the issue.
- The full booklet fits within the 35-page and 100,000-character analysis caps.

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
- Every important finding cites a supplied citation ID whose trusted page
  number and exact excerpt are attached by the application.
- No citation points to a page that was not supplied to the model.
- Questions identify uncertainty caused by selected-page retrieval.

## Cost Controls

- At most 35 pages and 100,000 extracted characters are sent per analysis.
- The first five pages are included, followed by keyword-relevant pages.
- Analysis is cached for the unchanged booklet, prompt, schema, and company
  profile.
- Actual token usage and estimated actual cost are stored after analysis.

## Deterministic Checks

`src/lib/ai/evaluate-booklet-analysis.ts` verifies the structured schema,
rejects obvious company eligibility overclaims and indirect bidder-support fit,
and requires every citation ID, page number, and excerpt to match the
application-owned citation catalog. Human bilingual review remains required
for interpretation quality.

## Live Evaluation Improvement Loop

Four representative paid attempts were correctly rejected and not stored:

- `v1` cited an unavailable page and paraphrased extracted excerpts.
- `v2` still cited omitted pages and returned non-verbatim excerpts; recorded
  estimated cost was `$0.02415325`.
- `v3` received all 35 pages but still failed 11 exact-excerpt checks and
  treated Catalyft's bidder-support services as company fit; recorded estimated
  cost was `$0.020477`.
- `v4` validated every application-owned citation successfully, but still
  returned four indirect bidder-support company-fit notes; recorded estimated
  cost was `$0.02122025`.

Prompting a model to reproduce extracted Arabic text character-for-character
was not reliable enough. `v4` replaces model-written citations with a
deterministic catalog of stable IDs such as `p012-s004`. The model selects IDs;
the application attaches and validates the trusted page and excerpt. `v5`
additionally removes indirect bidder-support company-fit notes before
validation and storage while preserving direct-scope notes. Both protections
pass local regression tests.

The representative `v5` live regression passed and was stored:

- all application-owned citation IDs, pages, and excerpts validated
- indirect bidder-support company-fit notes were removed
- remaining company-fit notes honestly identified Catalyft's direct capability
  and staffing gaps
- 35 of 35 pages were analyzed
- 55,728 tokens were used
- recorded estimated cost was `$0.02049625`
