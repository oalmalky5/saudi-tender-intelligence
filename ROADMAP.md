# Etimad Tender Intelligence Platform — Build Roadmap

## 1. Product Vision

Build an English-first tender intelligence platform for Saudi government procurement, then add a full Arabic/English product layer.

The platform helps companies:

- browse tenders in a cleaner interface
- filter tenders better than Etimad
- save, ignore, and track tenders
- create a company profile
- match tenders against company activities
- continuously monitor new tenders and notify companies about relevant opportunities
- generate AI summaries
- ask questions over the tender database
- produce a weekly AI tender report

The goal is not to build a full Etimad replacement immediately.

The first goal is:

> Build a small working tender intelligence app using real public Etimad data, then gradually add matching, AI, bilingual support, and automated monitoring.

---

## 2. Core Product Principle

Do not start big.

Every milestone must produce something visible and usable in the browser.

The app should grow through small working versions.

The rule:

> Build the normal workflow first. Add AI after the workflow already works.

---

## 3. Product Framing

Avoid framing the project as:

> “An Etimad clone.”

Better framing:

> “A bilingual AI-powered tender intelligence platform for Saudi procurement workflows.”

Portfolio framing:

> “Built a bilingual tender intelligence prototype for Saudi public procurement workflows, featuring structured tender search, company-profile matching, AI-generated tender summaries, and grounded Q&A over tender records.”

---

## 3.1 Initial Product Boundary

The initial product is a self-service tender relevance and discovery tool,
followed by an optional deeper qualification workflow for shortlisted tenders.

It should help a company answer:

- Is this tender related to what our company does?
- Why does it appear relevant or irrelevant?
- What publicly available requirements and deadlines should we review?
- What information is missing and must be checked in Etimad?

Public-data matching and summaries should not claim that a company is fully
eligible to bid. Complete eligibility, scope, staffing, evaluation, and
contractual requirements may only be available in the tender conditions
booklet.

When a booklet is freely available to the user through their authenticated
Etimad access, they may manually upload it for deeper analysis. Booklet analysis
improves decision support but still must not guarantee eligibility or success.

Private or sensitive company documents are not required for initial relevance
matching. Start with a plain-language company profile, services, activities,
industries, target entities, regions, and preferences.

---

## 4. Recommended Stack

Use familiar tools first.

### Frontend

- Next.js
- React
- TypeScript
- Tailwind or simple CSS

### Backend

- Next.js API routes/server actions
- Or FastAPI if needed later

### Database

- PostgreSQL
- Prisma or Drizzle

### AI

- Start with direct LLM API calls
- Do not start with agent frameworks
- Add RAG later
- Add agents last

### Search

- Start with normal Postgres filtering
- Add full-text search
- Add embeddings/vector search later if needed

---

## 5. Non-Negotiable Rules

### Rule 1: Use the least invasive reliable data source

Start with Etimad's public visitor JSON endpoint discovered during Milestone 0.

Use a small, manually triggered import during Milestone 1. Do not begin with
browser scraping, large-scale detail crawling, or scheduled ingestion.

Treat Etimad's public endpoints as an undocumented external integration:

- preserve raw source data
- use conservative request rates
- cache records
- keep CSV/manual import as a fallback
- seek written permission before production automation

### Rule 2: No AI before basic search works

Build tender browsing and filtering first.

Then add AI summaries, matching, and chat.

### Rule 3: No framework-first learning

Do not begin with LangChain, CrewAI, AutoGen, or agent frameworks.

Start with direct API calls.

### Rule 4: AI must be grounded

The AI should only answer from tender records in the database.

If information is missing, the AI should say it is missing.

### Rule 5: Every AI answer should reference tender records

The assistant should cite tender IDs, tender names, or source links.

### Rule 6: Build one flow at a time

Do not build the entire platform at once.

Complete one user journey, then move to the next.

### Rule 7: Separate relevance from eligibility

Relevance matching should use publicly available tender data and a lightweight
company profile.

Only make eligibility claims when the supporting tender requirements are
available. Otherwise, clearly state that eligibility cannot be confirmed from
public information.

---

# 6. MVP Definition

## MVP 1: Tender Browser

A user can:

- view tenders
- search tenders
- filter tenders
- open a tender detail page
- save or ignore tenders

## MVP 2: Tender Matching

A user can:

- create a company profile
- match tenders against company activities
- see a match score
- see reasons for the match

## MVP 3: AI Tender Analysis

A user can:

- generate AI summaries for tenders
- see risks, requirements, deadline notes, and next actions
- upload a shortlisted tender's conditions booklet for deeper analysis
- see booklet-derived requirements with page citations
- ask basic questions over retrieved tender records

## MVP 4: Weekly Tender Report

A user can:

- run a weekly tender search
- get ranked relevant tenders
- see reasons, risks, and recommended actions
- export or save the report

## MVP 5: Automated Tender Monitoring

A user can:

- have new and updated tenders automatically checked against their profile
- receive explainable notifications for strong relevance matches
- receive reminders for approaching deadlines
- control notification thresholds and frequency

---

# 7. Milestone Roadmap

## Milestone 0 — Etimad Data Access Investigation

### Goal

Determine whether real Etimad tender data can be accessed reliably enough to
build the product.

### Confirmed

- public unauthenticated JSON endpoint for tender discovery
- active-tender filtering and pagination
- public tender detail pages and detail components
- public lookups for regions, activities, agencies, and tender types
- Arabic-first source data
- observable rate limiting

### Decision

Use Etimad's public visitor JSON endpoint for a limited local proof of concept.
Fetch public detail pages only for new or changed tenders later.

Treat the endpoint as undocumented and unstable until Etimad/NCGR confirms
production automation and reuse are permitted.

### Reference

See `MILESTONE_0_ETIMAD_DATA.md` for endpoint details, field mapping, risks,
and the recommended ingestion design.

### Done when

The technical access path, limitations, and next ingestion step are documented.

Status: Complete on 2026-06-12.

---

## Milestone 1 — Project Setup, Etimad Import, and Tender List

### Goal

Create the first working version of the app using a limited set of real active
Etimad tenders.

### Build

- Next.js project
- PostgreSQL database
- Prisma/Drizzle setup
- manually triggered, read-only Etimad list importer
- import only the first 5 pages, up to 120 active tenders
- preserve raw source payloads
- upsert tenders by Etimad reference number
- `/tenders` page
- tender list UI
- English interface with original Arabic tender content
- source link back to Etimad

### Data Fields

Each tender should include:

```ts
{
  id: string
  reference_number: string
  tender_number?: string
  source_tender_id: number
  source_tender_id_string: string
  source_url: string
  source_system: "etimad"
  title_ar: string
  title_en?: string
  agency_name_ar: string
  branch_name_ar?: string
  tender_type_id: number
  tender_type_name_ar: string
  tender_status_id: number
  activity_id: number
  activity_name_ar: string
  published_at: string
  enquiries_deadline?: string
  submission_deadline?: string
  offers_opening_at?: string
  document_price?: number
  financial_fees?: number
  invitation_cost?: number
  description_ar?: string
  description_en?: string
  source_payload: unknown
  last_seen_at: string
}
```

This is an initial list-record schema. Detail enrichment fields will be added
when Milestone 2 fetches and parses public tender details.

### Learn only what is needed

- project setup
- database schema
- read-only HTTP data import
- validation and normalization
- idempotent upserts
- fetching records
- rendering a list

### Done when

You can manually run an import, open the browser, and browse real active Etimad
tenders stored in your own database.

Status: Complete on 2026-06-12.

---

## Milestone 2 — Tender Detail Page

### Goal

Allow users to inspect the publicly available details of a tender.

### Build

- `/tenders/[id]` page
- manually triggered detail enrichment for selected tenders
- parse the public Etimad detail page and relevant detail components
- preserve raw detail snapshots for debugging
- tender title
- agency
- activity
- execution region and city when available
- enquiry, submission, and opening deadlines
- description
- status
- source link
- clearly label missing or unavailable information

### Learn only what is needed

- dynamic routes
- fetching one record by ID
- parsing and normalizing public detail HTML
- formatting dates
- basic page layout

### Done when

You can enrich and open one tender to inspect all publicly available details
stored in your own database.

Status: Complete on 2026-06-12.

---

## Milestone 3 — Search and Filters

### Goal

Make the app useful as a tender browser.

### Build

Filters for:

- keyword
- agency
- activity
- region
- status
- deadline
- closing soon

Future discovery navigation should organize tender browsing into focused views:

- Discover: all tenders with deterministic filters and sorting
- Recommended: company-profile relevance ranking
- Closing Soon: deadline-prioritized opportunities
- Saved: manually selected tenders

The Recommended view should be introduced after company-profile matching
exists. AI-enhanced relevance ranking should improve that view later rather
than replace deterministic filters.

### Learn only what is needed

- query params
- database filtering
- search inputs
- pagination
- sorting

### Done when

You can search and filter tenders better than a basic table.

Status: Complete on 2026-06-12.

---

## Milestone 4 — Save, Ignore, and Notes

### Goal

Let users manage tender decisions.

### Build

- save tender
- ignore tender
- add note
- saved tenders page
- hide ignored tenders from default results

### Learn only what is needed

- user actions
- relational models
- form submissions
- optimistic UI if useful

### Done when

The app remembers which tenders matter to the user.

Status: Complete on 2026-06-12.

---

## Milestone 5 — Company Profile

### Goal

Let the app understand what kind of tenders the company wants.

### Build

Company profile fields:

- company name
- plain-language company summary
- services offered
- activities
- industries served
- target government entities
- regions
- preferred keywords
- excluded keywords
- preferred opportunity types

### Learn only what is needed

- profile form
- array fields
- validation with Zod
- storing user preferences

### Done when

You can create and edit a company profile.

Status: Complete on 2026-06-12.

---

## Milestone 6 — Rule-Based Tender Matching

### Goal

Recommend tenders without AI first.

### Build

A scoring function that checks:

- activity match
- keyword match
- region match
- deadline urgency
- excluded keywords

Example scoring logic:

```ts
score =
  activityMatch * 45 +
  keywordMatch * 30 +
  regionMatch * 15 +
  deadlineUrgency * 10
```

Each tender should show:

- match percentage
- matched reasons
- possible concerns

### Learn only what is needed

- scoring algorithms
- explainable matching
- sorting by score
- clean result UI

### Done when

The app can rank tender relevance against a company profile without AI.

Status: Complete on 2026-06-12.

---

## Milestone 7 — First AI Feature: Tender Summary

### Goal

Add AI in the smallest useful, grounded, and measurable way.

### Build

Add a manual button on a tender detail page:

> Summarize Tender

During local development, summaries must only be generated when this button is
clicked. Importing or enriching tenders must not automatically call the AI API.

Use the OpenAI API to generate an English summary from the tender data already
stored in the application. Prefer enriched tenders, but allow summaries for
unenriched tenders when the output clearly identifies missing information.

The structured output must include:

- summary
- requirements
- deadline notes
- risks
- fit notes
- questions to ask before applying
- next actions
- missing information

Fit notes should only be generated when a company profile exists. They describe
relevance between the company and tender; they must not claim the company is
eligible, likely to win, or guaranteed to be a good bidder.

### Grounding Rules

The AI must:

- use only the tender and company-profile data provided by the application
- state clearly when information is missing or unavailable
- never invent requirements, deadlines, values, or eligibility criteria
- distinguish confirmed facts from possible concerns
- never claim that a company is eligible or likely to win
- return output that passes structured JSON validation

### Summary History and Staleness

- Show the latest successful summary by default.
- Preserve previous summary versions for debugging and comparison.
- Store the generation date, model, prompt version, tender update time, and
  company-profile update time with each summary.
- Mark a summary as stale when its tender or company profile changed after the
  summary was generated.

### Cost Controls

- OpenAI API billing is separate from ChatGPT or Codex subscriptions.
- Start with a suggested monthly testing budget of USD 10 and a hard limit of
  USD 20.
- Log API usage and estimated cost for each generation.
- Keep generation manual during development to prevent accidental bulk usage.

### Initial AI Evaluation

Create a small evaluation set of approximately 10 representative tenders,
including:

- enriched and unenriched tenders
- tenders with missing deadlines
- clearly irrelevant tenders
- tenders with confusing or incomplete fields
- Arabic source data requiring an English summary

Evaluate each output for:

- groundedness in the supplied data
- honesty about missing information
- requirement and deadline accuracy
- absence of eligibility or winning-probability overclaims
- valid structured output
- practical usefulness

Begin with deterministic checks and a manual review checklist. Model-based
grading may be added later, but human review remains the standard for factual
accuracy.

### Suggested Build Sequence

1. Add summary storage and version history.
2. Define and validate the structured output schema.
3. Build the grounded tender and company-profile data serializer and prompt.
4. Add the manual Summarize Tender action.
5. Store and display the latest successful summary.
6. Detect and display stale summaries.
7. Add the initial evaluation fixtures and checklist.
8. Add API usage and estimated-cost logging.

### Learn only what is needed

- direct LLM API calls
- structured JSON output
- prompt design
- error handling
- storing and versioning AI output
- basic AI evaluation
- API usage and cost tracking

### Done when

A tender can have a stored, grounded English AI summary with version history,
staleness detection, usage logging, and an initial evaluation checklist.

Status: Implementation and initial live output evaluation complete on
2026-06-12. Continue evaluating prompt changes against representative tenders.

---

## Milestone 8 — Bilingual Arabic/English Layer

### Goal

Make the product usable in both Arabic and English.

### Build

- language toggle
- Arabic/English labels
- RTL support
- Arabic tender data
- English tender data when available
- honest Arabic fallback when English tender fields are unavailable
- AI translation for missing English fields later, only if evaluation shows it
  is useful and grounded

### Learn only what is needed

- i18n in Next.js
- RTL styling
- translation prompts
- storing generated translations

### Done when

A user can switch between Arabic and English.

Status: Complete on 2026-06-12. The interface, dates, navigation, controls, and
deterministic matching explanations switch between English/LTR and Arabic/RTL.
Stored AI summaries remain English-only by current product decision.

---

## Milestone 8.5 — English Tender Translation

### Goal

Make public Arabic tender titles and descriptions understandable and searchable
in English without changing or replacing the Arabic source.

### Build

- manual, on-demand AI translation for a tender
- faithful translation of title and public description only
- strict structured output with no summarizing, inference, or added facts
- append-only translation history with model, prompt, token, and cost metadata
- source-content hash for accurate staleness detection
- cached current English fields used by tender lists, details, and search
- deterministic checks and a human evaluation checklist

Translation stays manual during development so API spend remains intentional.
Automatic translation of every imported tender should only be considered after
quality and cost are measured on a representative evaluation set.

Update: automatic translation is now implemented through Azure Translator for
new and changed tenders. The original OpenAI action remains available as an
optional improved translation.

### Done when

A user can translate one tender on demand, view the English result, identify a
stale translation after Arabic source text changes, and inspect its generation
metadata.

---

## Milestone 9 — AI Tender Matching

### Goal

Use AI to improve tender ranking and explanations.

### Flow

1. User has a company profile.
2. App runs normal filters/scoring first.
3. App selects top candidate tenders.
4. AI reviews only those tenders.
5. AI returns ranked results with explanations.

### AI output

For each tender:

- relevance score
- why it matches
- why it may not match
- what to check next
- recommended action
- confidence based on available public information

The AI must not claim full eligibility when the complete tender requirements
are unavailable. It should clearly identify what must be checked after logging
into Etimad or reviewing the conditions booklet.

### Learn only what is needed

- ranking prompts
- structured AI output
- prompt chaining
- token limits
- AI evaluation

### Done when

The user can click “Find Relevant Tenders” and receive an AI-ranked shortlist.

Implementation uses one manual paid request over at most 10 candidates.
Positive deterministic matches are selected first; recent zero-score tenders
fill remaining slots so AI can recover some semantic and cross-language
matches. This bounds cost and keeps the rule-based ranking visible for
comparison. Initial evaluation remains required before the shortlist should
influence notifications or automatic workflows.

Status: Implementation complete on 2026-06-13. The first live evaluation is
pending creation of a representative primary company profile.

---

## Milestone 10 — Tender Booklet Analysis

### Goal

Analyze the detailed Arabic conditions booklet for a shortlisted tender and
turn it into a cited English qualification review.

This is a deliberate post-discovery workflow. The app must never automatically
download or analyze every booklet.

### Flow

1. Public-data matching identifies a promising tender.
2. The user obtains the booklet through their authorized Etimad access.
3. The user manually uploads the PDF to the tender record.
4. The app extracts text locally and detects whether OCR is required.
5. Repeated headers, footers, and standard boilerplate are separated from
   tender-specific content.
6. The app shows an estimated AI-analysis cost.
7. The user explicitly starts analysis.
8. Structured results are stored and reused without reanalyzing unchanged
   documents.

### Structured Output

- executive English summary
- detailed scope and deliverables
- confirmed bidder eligibility requirements
- required licenses, certificates, and documents
- staffing and qualification requirements
- submission requirements and evaluation criteria
- guarantees, penalties, and contractual risks
- local-content requirements
- questions and unclear points
- company-fit notes based on available profile data
- page citations for every important conclusion

### Grounding and Safety Rules

- Preserve the original uploaded PDF and a hash of its contents.
- Extract text locally before making any AI request.
- Cite page numbers and source excerpts for important conclusions.
- Clearly separate standard legal boilerplate from tender-specific terms.
- Never infer that a company satisfies a requirement without supporting company
  data.
- Never guarantee eligibility, compliance, or winning probability.
- Treat uploaded-document text as untrusted data, not instructions.
- Mark low-confidence OCR or extraction results for human review.

### Cost Controls

- Analysis is manual and limited to shortlisted tenders.
- Text extraction, cleanup, section detection, and keyword search run locally.
- Send only relevant sections to AI where possible.
- Analyze each unchanged booklet once and cache the structured results.
- Show estimated cost before analysis and actual usage afterward.
- Regenerate only when the document, model, prompt, or analysis schema changes.

### Initial Evaluation

Use the provided `MHRSD - Innovation Center (Ar).pdf` booklet as the first
representative fixture. Verify that analysis can identify and cite:

- project scope and deliverables
- required licenses and certificates
- team and language requirements
- evaluation and submission requirements
- guarantees and contractual risks
- tender-specific terms versus standard boilerplate

### Learn only what is needed

- secure file uploads
- PDF text extraction
- OCR fallback
- content hashing and cached analysis
- section-aware chunking
- retrieval over document sections
- page-level citations
- long-document AI evaluation

### Done when

A user can manually upload one booklet, review the estimated cost, generate a
stored English qualification analysis, and verify every important conclusion
against cited booklet pages.

Status: Implementation complete on 2026-06-13. Automated verification passed.
The first representative PDF extraction and paid cited analysis remain pending
because macOS blocks programmatic access to the fixture while it is in
`Downloads`; it can be validated by uploading it through the tender detail UI.

---

## Milestone 11 — Chat With Tender Database

### Goal

Let users ask questions over tender records.

### Example questions

- What tenders are closing this week?
- Show ICT tenders in Riyadh.
- Which tenders fit this company profile?
- Compare these 3 tenders.
- Which tenders should we prioritize?
- Which tenders look risky?

### Flow

User question → retrieve relevant tender records → AI answers using only those records.

### Learn only what is needed

- basic RAG
- retrieval
- query filtering
- grounding
- citations
- refusal when data is missing

### Done when

The AI can answer questions based only on retrieved tender records.

Implementation uses deterministic retrieval over at most 20 local tender
records followed by one structured paid AI request. Every supported answer must
cite retrieved tender IDs; empty or insufficient retrieval must produce an
explicit unsupported answer.

Status: Implementation and initial live evaluation complete on 2026-06-13.
Continue evaluating keyword, company-fit, comparison, and unsupported
questions before adding multi-turn conversational memory.

---

## Milestone 12 — CSV Import

### Goal

Update the database without editing code.

### Build

- admin import page
- upload CSV
- map fields
- validate records
- detect duplicates
- insert new tenders
- update existing tenders
- show import summary

### Learn only what is needed

- CSV parsing
- data validation
- upsert logic
- duplicate detection

### Done when

You can upload a CSV and update the tender database.

### Implementation

- `/admin/import` provides a local-only staged import workflow.
- Known English and Arabic header aliases are mapped automatically and shown
  before import.
- Every row is validated before writing; invalid and duplicate rows remain
  visible in the preview and are not imported.
- Valid rows are upserted by tender reference number, so new records are
  created and existing records are updated.
- Uploads are limited to 5 MB and 2,000 rows.
- Import sessions store mapping, preview rows, counts, and completion results
  for local auditability.

### Current Boundary

The first version automatically maps recognized headers. Manual dropdown
mapping for unfamiliar column names can be added later if real client CSV
formats require it.

Status: Implementation and local verification complete on 2026-06-13.

---

## Milestone 13 — Automated Monitoring and Notifications

### Goal

Continuously monitor tender updates and notify companies when relevant
opportunities appear.

### Build

- scheduled job
- fetch/import Etimad public visitor data conservatively
- detect new tenders
- detect updated tenders
- enrich only new or changed tenders
- run matching for affected tenders and company profiles
- in-app notification center
- configurable relevance threshold
- deadline reminders
- daily or weekly digest
- log import results
- alert on errors

### Data Access Priority

1. Official/approved Etimad API or integration access
2. Confirmed public Etimad visitor endpoints
3. Manual CSV import
4. Admin entry
5. Third-party API
6. Browser scraping only after checking legality and terms

### Learn only what is needed

- cron jobs
- background jobs
- retries
- logs
- idempotency
- change detection
- notification delivery
- relevance threshold tuning

### Done when

New and updated tenders can be imported on a schedule, matched against company
profiles, and surfaced through explainable notifications.

### Implementation

- `npm run monitor:run` executes the same monitoring job that a local cron task
  or future hosted scheduler can invoke.
- The job fetches up to five Etimad public visitor pages conservatively,
  classifies stable business-data changes, and imports the current records.
- Only a bounded set of new or changed tenders is detail-enriched per run.
- Deterministic company matching creates explainable notifications without
  paid AI requests.
- Notification settings include a relevance threshold, deadline-reminder
  window, and daily, weekly, or disabled digest frequency.
- `/notifications` provides manual monitoring, unread states, notification
  settings, tender links, error alerts, and monitoring-run history.
- Stable notification keys and stable tender-version fingerprints make repeat
  runs idempotent.

### Current Boundary

The monitoring command is scheduler-ready, but a recurring cron entry is not
installed automatically on the development machine. Deployment will determine
whether cron, a hosted scheduler, or a background-worker service invokes it.
The local notification center does not yet send email, SMS, or WhatsApp.

### Initial Live Verification

- First run fetched 120 tenders, discovered 6 new and 114 genuinely changed
  records, and enriched 5 affected tenders without errors.
- A repeated run initially exposed Etimad's volatile `remainingMins` and
  `currentDateTime` transport fields. Excluding them from version fingerprints
  corrected false change detection.
- Final repeated run fetched the same 120 records and correctly classified all
  120 as unchanged, with no enrichment work or duplicate notifications.

Status: Local-first implementation and live verification complete on
2026-06-13. Register the monitoring command with the chosen scheduler when the
runtime/deployment environment is selected.

---

## Milestone 14 — Weekly AI Tender Report

### Goal

Create the main product workflow.

### Build

A button:

> Generate Weekly Tender Report

The report should include:

- company profile
- date range
- top relevant tenders
- closing soon tenders
- high-risk tenders
- tenders to ignore
- recommended actions
- tender links

### Learn only what is needed

- report generation
- AI synthesis
- markdown output
- export later if needed

### Done when

The app can generate a useful weekly tender report from the database.

### Implementation

- `/reports/weekly` provides the primary report-generation and review
  workspace.
- Each report uses one bounded paid AI request over at most 20 curated tenders.
- Candidate curation prioritizes saved opportunities, deterministic relevance,
  near deadlines, the selected date range, and recency.
- Structured AI output covers an executive summary, market signals,
  recommended actions, limitations, and categorized tender reviews.
- Deterministic checks reject unknown tender IDs and eligibility or
  winning-probability overclaims before storage.
- The application renders validated output into Markdown with trusted local
  tender links.
- Stored reports include date range, source profile/tender versions, model,
  prompt version, token usage, and estimated cost.
- `npm run report:weekly` invokes the same report service as the web button.

### Current Boundary

Reports require a primary company profile because relevance, ignore decisions,
and recommended actions cannot be meaningfully generated without one. Export
to PDF or Word is deferred; validated Markdown is stored and visible in the
report workspace.

### Initial Verification

- The paid live evaluation stopped before making an OpenAI request because no
  primary company profile currently exists.
- Create a representative company profile before judging report usefulness and
  cost.

Status: Implementation and local verification complete on 2026-06-13. Live AI
report evaluation remains pending a representative company profile.

### Matching Quality Guardrail

Company fit now requires direct evidence that the company itself could
plausibly deliver the tender's requested scope. Contextual overlap such as a
target government entity, region, SME preference, public-sector procurement,
or the ability to help another bidder does not establish fit. Zero credible
matches is a valid chat, shortlist, notification, and weekly-report outcome.

---

## Milestone 15 — Product Styling and Experience Refinement

### Goal

Turn the proven workflows into a cohesive, polished portfolio and client-facing
product experience.

### Build

- consistent application navigation
- focused views: Discover, Recommended, Closing Soon, and Saved
- refined information hierarchy and tender cards
- cohesive spacing, typography, colors, and component states
- responsive desktop and mobile layouts
- loading, empty, error, success, and disabled states
- accessibility review
- visual treatment for match scores, confidence, risks, and recommendations
- portfolio-ready dashboard and demo flow

This milestone should improve presentation without changing the underlying
matching, AI, or ingestion behavior.

### Learn only what is needed

- reusable design-system components
- responsive layouts
- accessibility basics
- interaction and state design
- visual regression testing if useful

### Done when

The main workflows feel consistent, intentional, and polished enough for a
portfolio demonstration and early client feedback.

### Experience Principle

Every product section must feel responsive and alive rather than behaving like
a static administrative website. New sections should include:

- clear active and selected states
- purposeful hover, focus, pressed, loading, success, and error feedback
- smooth transitions that clarify navigation and state changes
- layered visual hierarchy instead of undifferentiated white boxes
- responsive behavior designed for desktop and mobile
- reduced-motion support for accessibility

Motion should communicate state and continuity. It should never delay work,
hide information, or exist only as decoration.

### Implementation

- Added a persistent animated application shell shared by every route.
- Replaced repeated page headers with active-route navigation, mobile top bar,
  and a compact mobile navigation dock.
- Introduced a cohesive visual system using layered surfaces, ambient color,
  stronger hierarchy, modern typography, and depth.
- Added route transitions, staggered card entrances, hover elevation, active
  navigation indicators, responsive control feedback, animated details, and
  loading skeletons.
- Applied shared interaction behavior across cards, forms, buttons, tables,
  empty states, tender details, AI workflows, reports, notifications, company
  profile, and admin tools.
- Added `prefers-reduced-motion` behavior so animation remains accessible.

### Verification

- Visually reviewed Discover, Chat, Company Profile, Weekly Reports, and mobile
  navigation using local browser captures.
- 84 automated tests passed.
- Lint and the production build passed.

Status: Initial cohesive product-experience redesign complete on 2026-06-13.
Continue refining individual workflows during real user feedback rather than
allowing new static sections to diverge from the shared system.

---

## Portfolio Completion Strategy

The immediate goal after Milestone 15 is not to launch Etimad AI as a
multi-tenant Catalyft product. The goal is to finish a credible, deployed,
recruiter-ready product that demonstrates:

- full-stack product development
- ingestion and normalization of imperfect external data
- explainable deterministic and AI-assisted matching
- grounded AI summaries, chat, reports, translations, and document analysis
- evaluation, hallucination controls, and API cost awareness
- polished user experience and sound engineering judgment

Remaining milestones should strengthen that story. Enterprise SaaS features
that do not materially improve the portfolio demonstration are explicitly
deferred.

---

## Milestone 16 — Portfolio Foundation and Repository Quality

### Goal

Make the repository understandable and credible to a technical reviewer before
they run the application.

### Build

- audit and organize the current working tree
- remove accidental generated or temporary artifacts from version control
- ensure secrets and uploaded documents cannot be committed
- provide a reliable local setup path with documented environment variables
- add seed/demo data so the main workflows can be evaluated consistently
- document the architecture, data flow, AI boundaries, and key trade-offs
- rewrite the README around the problem, solution, screenshots, setup, and
  technical decisions
- document known Etimad access limitations and the portfolio-demo boundary
- confirm lint, tests, migrations, and production build run from a clean clone

### Done when

A recruiter or engineer can understand the product, run it locally, and see
evidence of thoughtful technical decisions without needing an explanation from
the author.

### Implementation

- Reframed the README around the problem, complete product workflow, technical
  highlights, setup path, grounding rules, and deliberate scope decisions.
- Added `ARCHITECTURE.md` to explain ingestion, deterministic processing, AI
  contracts, cost controls, trade-offs, and remaining production gaps.
- Added a non-sensitive demonstration company profile through
  `npm run demo:seed`; it refuses to overwrite an existing profile unless
  `--replace` is explicitly supplied.
- Added one full repository verification command through `npm run check`.
- Documented every server-side environment variable and confirmed local
  secrets, generated Prisma code, build output, dependencies, and uploaded
  documents are ignored.
- Removed unused starter assets from the public directory.

### Verification

- The demo seed detected the existing Catalyft profile and made no changes.
- Git hygiene checks confirmed that secrets, generated code, runtime output,
  dependencies, and uploaded booklets are untracked and ignored.
- 84 automated tests, lint, Prisma validation, and the production build passed.

Status: Initial implementation complete on 2026-06-14. Repeat the documented
setup from a clean clone after the next repository commit to close the final
reproducibility check.

---

## Milestone 17 — Trustworthy AI Evaluation and Demo Scenarios

### Goal

Prove that the AI features are useful, grounded, and capable of returning no
match when no credible fit exists.

### Build

- create a stable representative demo company profile
- create a small curated evaluation set for summaries, matching, chat, weekly
  reports, translations, and booklet analysis
- include positive matches, weak matches, irrelevant tenders, missing data,
  misleading contextual overlap, and explicit no-match cases
- run deterministic checks and record human review results
- surface citations, limitations, confidence, and missing-information messages
  clearly in the interface
- record model, prompt version, token usage, estimated cost, and evaluation
  outcome for representative runs
- document the improvements made after failed or misleading outputs

### Current Boundary

This milestone does not require a complex evaluation platform, fine-tuning, or
continuous automated model grading. A small, well-documented evaluation set
with reproducible results is more valuable for the portfolio.

### Done when

The project can demonstrate both useful recommendations and honest refusal or
no-match behavior, with evidence showing how AI quality was evaluated.

### Implementation

- Added one reproducible portfolio scorecard covering summaries, translation,
  AI matching, database chat, weekly reports, and booklet analysis.
- Added 16 representative scenarios that exercise both valid outputs and
  adversarial failures.
- Included explicit scenarios for honest no-match behavior, missing-data
  concealment, invented translation details, eligibility overclaims,
  indirect bidder-support reasoning, unretrieved citations, and fabricated
  booklet citation IDs.
- Added `npm run ai:portfolio:evaluate`; it runs locally without making any
  OpenAI requests.
- Documented the evaluation layers, current results, and limits in
  `AI_EVALUATION_SCORECARD.md`.

### Current Deterministic Result

- 16 of 16 representative scenarios behaved as expected.
- 7 valid outputs were accepted.
- 9 unsafe or unsupported outputs were rejected.
- 0 paid OpenAI requests were made.

### Initial Live-Model Review

- Matching prompt `v2` correctly scored 10 unrelated Catalyft candidates at
  10% or below and recommended `IGNORE`, but human review found misleading
  indirect bidder-support statements in `whyMatches`.
- Matching prompt `v3` requires empty `whyMatches`, a score of at most 10, and
  `IGNORE` whenever deterministic matching finds no direct-scope evidence.
- The `v3` regression run satisfied the strengthened contract for all 10
  candidates and cost approximately `$0.00561`.
- The live weekly report explicitly reported zero Catalyft matches. Its six
  reviewed tenders were included only as `IGNORE`, `HIGH_RISK`, or
  `CLOSING_SOON` market-awareness items and cost approximately `$0.00548`.
- Summary prompts `v3` and `v4` exposed indirect fit and unsupported external
  action instructions during human review.
- Summary prompt `v5` passed the strengthened fit/action guardrails and human
  review, costing approximately `$0.00251`.
- `npm run ai:stored:audit` now re-evaluates all stored real outputs against
  current guardrails. It currently audits 13 outputs, with 8 current passes and
  5 deliberately preserved historical failures.
- The representative 35-page conditions booklet was extracted locally without
  OCR. Three live analysis attempts exposed unreliable model-written Arabic
  excerpts and indirect company-fit reasoning; all failed outputs were rejected
  and not stored.
- Booklet prompt `v4` now asks the model to select deterministic citation IDs.
  The application owns and verifies the exact page number and excerpt.
- The live `v4` run validated all citations but was rejected because it still
  returned four indirect bidder-support company-fit notes. `v5` now removes
  those unsafe notes deterministically before validation and storage.
- The representative live `v5` run passed every deterministic check and was
  stored. It analyzed all 35 pages, retained honest direct-capability gaps, and
  cost approximately `$0.02050`.

Status: Complete on 2026-06-14. The deterministic scorecard and representative
live regressions now cover summaries, matching, weekly reports, and cited
booklet analysis.

---

## Milestone 18 — Simple Authentication and Demo Workspace

### Goal

Make personal company data and saved workflows feel credible in a deployed
demo without building enterprise account management.

### Build

- sign in and sign out
- protect company profile, saved tenders, reports, notifications, and admin
  workflows
- associate private records with one user-owned company workspace
- provide a pre-populated read-only or resettable demo account
- prevent one user from accessing another user's private records
- add basic session and authorization tests

### Explicitly Deferred

- team invitations
- multiple roles and permission matrices
- organization switching
- SSO, MFA, and enterprise identity providers
- subscriptions, billing, and usage-based plans

### Done when

A reviewer can access a safe demo workspace, while authenticated users' private
company data and tender decisions are isolated.

### Implementation

- Added database-backed users and one user-owned workspace per account.
- Added signed HTTP-only seven-day sessions, sign in, sign out, and a polished
  demo login page.
- Added Next.js 16 Proxy redirects for private routes and repeated database
  authorization inside private pages and every Server Action.
- Kept public tender discovery available while hiding private decisions,
  summaries, uploads, company data, chat, reports, notifications, and admin
  workflows from anonymous visitors.
- Scoped company profiles, tender decisions, summaries, chats, booklet uploads,
  CSV imports, and monitoring runs to workspaces; existing Catalyft records were
  backfilled into `primary-workspace`.
- Added `npm run auth:seed-demo` to create or reset a safe demo login.
- Added password-hashing, signed-session, tampering, and Proxy authorization
  tests.

### Verification

- Anonymous `/company` requests redirect to `/sign-in?next=%2Fcompany`.
- Anonymous `/tenders` requests remain publicly viewable.
- A valid signed session can access the Catalyft workspace.
- Existing private records were preserved and assigned to the demo workspace.

Status: Initial implementation complete on 2026-06-14. Production rate
limiting and safe automated demo-data reset remain part of Milestone 19.

---

## Milestone 19 — Deployment and Reliable Portfolio Demo

### Goal

Publish a stable demo that recruiters can open without local setup.

### Build

- deploy the Next.js application and PostgreSQL database
- configure production environment variables and migrations
- deploy a safe, conservative scheduled monitoring demonstration
- add health checks, structured error logging, and basic uptime monitoring
- add clear failure states when Etimad or OpenAI is unavailable
- establish database backup and demo-data reset procedures
- apply API rate limits and upload-size limits to public demo actions
- verify the complete desktop and mobile demo journey in production

### Current Boundary

The scheduled monitor only needs to demonstrate the architecture reliably. It
does not need to provide a commercial availability guarantee or continuously
mirror all Etimad tenders.

Outbound email, SMS, and WhatsApp delivery are deferred. The in-app
notification center and scheduler-ready monitoring flow are sufficient for the
portfolio demonstration.

### Done when

A recruiter can open the deployed application, follow the core workflow, and
see graceful behavior even when an external service fails.

---

## Milestone 20 — Portfolio Case Study and Final Demo

### Goal

Turn the working product into a concise, memorable demonstration of engineering
and product ability.

### Build

- create a guided demo journey covering discovery, matching, no-match behavior,
  summary, chat, monitoring, weekly report, and booklet analysis
- add representative screenshots or a short product walkthrough video
- write a case study explaining the problem, constraints, architecture,
  important decisions, failed approaches, and measured outcomes
- include an architecture diagram and data-flow explanation
- publish AI evaluation and cost-control results
- document known limitations and what would be required for a Catalyft
  production launch
- perform final accessibility, responsive-design, security, and repository
  review

### Done when

The project is deployed, documented, easy to evaluate, and communicates a clear
story within a few minutes while rewarding deeper technical inspection.

---

# 8. First 7 Build Sessions

## Session 1 — Start the App

Build:

- Next.js app
- database setup
- tender schema
- manually triggered Etimad list importer
- import up to 120 active tenders
- tender list page

Done when:

> I can manually import and browse real active Etimad tenders.

---

## Session 2 — Tender Details

Build:

- tender detail page
- clickable tender cards
- manually enrich selected tenders
- publicly available tender information

Done when:

> I can open one tender and inspect it.

---

## Session 3 — Filters

Build:

- keyword search
- activity filter
- region filter
- status filter
- deadline sorting

Done when:

> I can search and filter tenders.

---

## Session 4 — Save and Ignore

Build:

- save tender
- ignore tender
- saved tenders page
- notes

Done when:

> I can manage tenders I care about.

---

## Session 5 — Company Profile

Build:

- company profile form
- company summary
- services
- activities
- industries
- target entities
- regions
- keywords

Done when:

> The app knows what my company is looking for.

---

## Session 6 — Match Scoring

Build:

- scoring function
- match percentage
- match reasons
- sorted recommendations

Done when:

> The app recommends tenders without AI.

---

## Session 7 — AI Summary

Build:

- summarize tender button
- AI API call
- structured AI response
- save summary to database

Done when:

> A tender can have an AI-generated summary.

---

# 9. AI Assistant Usage Pattern

Use AI tools as a pair programmer, not as a replacement.

## Before coding

Write a small task.

Example:

```txt
I am building Milestone 3: tender filters.

Current stack:
- Next.js
- TypeScript
- Prisma
- PostgreSQL

Task:
Build keyword, activity, region, status, and deadline filters for the /tenders page.

Constraints:
- Keep the code simple.
- Explain every file changed.
- Do not add unnecessary libraries.
- Ask me before changing the database schema.
```

## After AI writes code

Ask:

```txt
Explain this code line by line.
What assumptions did you make?
What could break?
How can I test it manually?
```

## Before accepting code

Check:

- Do I understand it?
- Is it solving only the current task?
- Did it add unnecessary complexity?
- Did it create files I do not need?
- Can I explain this in an interview?

## Commit small

Example commits:

```txt
feat: add tender list page
feat: add tender detail page
feat: add tender filters
feat: add saved tenders
feat: add company profile form
feat: add rule-based tender matching
feat: add AI tender summaries
```

---

# 10. Prompt Templates for Building

## Planning Prompt

```txt
I am building the Etimad Tender Intelligence Platform.

Current milestone:
[insert milestone]

Current stack:
[insert stack]

What I already have:
[insert current state]

What I want to build now:
[insert task]

Give me:
1. the smallest implementation plan
2. files I likely need to create or edit
3. risks or decisions
4. what “done” looks like

Do not write code yet.
```

---

## Coding Prompt

```txt
Build this feature now.

Feature:
[insert feature]

Constraints:
- TypeScript
- keep it simple
- no unnecessary libraries
- explain all code
- do not change unrelated files
- do not invent product requirements

After writing the code, explain:
1. what changed
2. how it works
3. how I can test it
4. what to improve later
```

---

## Debugging Prompt

```txt
I am getting this error:

[paste error]

Here is the relevant code:

[paste code]

Explain:
1. what the error means
2. the likely cause
3. the smallest fix
4. how to avoid it next time

Do not rewrite the whole feature unless needed.
```

---

## Code Review Prompt

```txt
Review this code as a senior full-stack engineer.

Focus on:
- correctness
- simplicity
- security
- database performance
- readability
- whether I actually need this complexity

Do not rewrite everything.
Give me specific changes only.
```

---

## AI Feature Prompt

```txt
I am adding an AI feature to the tender platform.

Feature:
[summary / matching / chat / report]

Important rule:
The AI must only use tender data provided from the database.
If information is missing, it must say it is missing.
It must not invent tender requirements, deadlines, values, or eligibility.

Help me design:
1. the input data shape
2. the prompt
3. the expected JSON output
4. failure cases
5. how to test hallucination risk
```

---

# 11. Learning Path While Building

Do not study everything upfront.

Learn only when the milestone requires it.

## Learn during Milestones 1–4

- database schema
- CRUD
- external data validation
- idempotent imports
- filters
- search params
- pagination
- relational models

## Learn during Milestones 5–6

- product modeling
- scoring logic
- explainable recommendations
- profile-based matching

## Learn during Milestones 7–9

- LLM API calls
- prompts
- structured output
- grounding
- AI ranking
- hallucination control

## Learn during Milestone 10

- PDF extraction and OCR
- document chunking
- content hashing and cached analysis
- page citations
- long-document grounding and evaluation

## Learn during Milestone 11

- RAG basics
- retrieval
- query interpretation
- source-based answers

## Learn during Milestones 12–13

- CSV import
- API ingestion
- scheduled jobs
- duplicate detection
- change detection
- notifications
- logs and retries

## Learn during Milestone 14

- report generation
- AI synthesis
- export formats

## Learn during Milestone 15

- reusable product design systems
- responsive interaction design
- accessibility and reduced motion

## Learn during Milestones 16–17

- repository and architecture documentation
- reproducible demo data
- AI evaluation design
- hallucination and no-match testing
- communicating engineering trade-offs

## Learn during Milestones 18–19

- authentication and authorization boundaries
- production environment configuration
- deployment, migrations, logs, health checks, and rate limiting
- operating safely around unreliable external services

## Learn during Milestone 20

- technical case-study writing
- architecture diagrams
- product demonstration and portfolio storytelling

---

# 12. Explicitly Deferred Beyond the Portfolio Release

Do not build these before the portfolio release:

- payments, subscriptions, invoices, or usage billing
- user teams, invitations, organization switching, or complex role permissions
- enterprise SSO, MFA, or identity-provider integrations
- a full customer-support or operations admin dashboard
- outbound SMS, WhatsApp, or highly configurable notification delivery
- a native mobile app or browser extension
- complex agent systems, fine-tuning, or a vector database without measured need
- browser scraping unless the public-data path stops being viable and the legal
  and operational implications have been reviewed
- proposal generation or claims about bid eligibility and likelihood of winning
- PDF or Word report export unless it directly improves the final demo
- multi-tenant SaaS infrastructure, microservices, Kubernetes, or
  high-availability architecture
- formal compliance programs, audit exports, or enterprise data-retention tools

These are valid future product investments if Catalyft chooses to launch the
platform commercially. Omitting them from the portfolio release is a deliberate
scope decision, not an unfinished prototype.

Focus the remaining work on:

> trustworthy AI → simple demo authentication → reliable deployment → strong
> documentation and case study

---

# 13. Final Portfolio Demo Target

The final demo should show:

1. A polished English-first tender discovery dashboard using real Etimad data.
2. A company profile and explainable deterministic recommendations.
3. AI matching that can confidently recommend a tender or return no credible
   match.
4. Grounded English summaries, translations, and database chat with citations.
5. A weekly report and monitoring notifications over new or changed tenders.
6. On-demand booklet analysis with page citations.
7. Visible AI limitations, evaluation results, and cost controls.
8. A deployed demo account and a repository that explains the architecture and
   decisions.

Demo sentence:

> “I built an English-first tender intelligence platform for Saudi public
> procurement that imports and normalizes real Etimad data, explains company
> relevance, grounds AI answers in source records, analyzes detailed tender
> documents with citations, and evaluates recommendation quality and cost.”

---

# 14. Final North Star

The final product experience should be:

1. User creates a company profile.
2. Platform continuously updates the tender database.
3. System checks new and updated tenders against the company profile.
4. User receives explainable notifications about relevant opportunities.
5. User can also run manual searches and matching.
6. AI ranks and explains matches using available tender information.
7. User gets a clear weekly action report.
8. User navigates focused Discover, Recommended, Closing Soon, and Saved
   experiences through a cohesive, polished interface.

The long-term product is:

> A self-service AI tender discovery and monitoring assistant for Saudi procurement.

The portfolio-release finish line is:

> A polished deployed demo with trustworthy AI behavior, simple authentication,
> reproducible evaluation evidence, and a compelling technical case study.

---

## Milestone 19 — Deployment And Reliable Portfolio Demo

### Goal

Make the portfolio build safe and predictable to host, demonstrate, monitor,
and restore.

### Implemented

- database-backed limits for paid AI, uploads, CSV imports, and monitoring
- database health endpoint with configuration indicators
- secret-protected scheduler endpoint for bounded monitoring
- structured JSON logs for health and scheduled monitoring
- guarded demo-workspace reset command
- deployment, migration, backup, and recovery documentation

### Remaining external setup

- select a hosting provider and hosted PostgreSQL service
- configure production secrets, backups, alerts, and scheduler
- move booklet files to private object storage before enabling public uploads
- publish and verify the hosted portfolio URL
