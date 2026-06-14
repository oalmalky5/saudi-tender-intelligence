# Architecture And Engineering Decisions

## System Goal

Etimad Tender Intelligence is a local-first decision-support application over
Saudi public-procurement data. It helps a company discover and investigate
tenders while remaining honest about incomplete public information.

The platform is deliberately not a bid-eligibility engine. Public-data
relevance, detailed booklet qualification, and final human bid decisions are
separate stages.

## Main Components

```text
External sources
  - Etimad public visitor list and detail pages
  - Manual CSV uploads
  - User-authorized booklet PDF uploads
                |
                v
Ingestion and validation
  - Zod validation
  - normalized tender mapping
  - idempotent upserts and change fingerprints
  - raw source snapshots for debugging
                |
                v
PostgreSQL through Prisma
  - tenders and details
  - company profile and decisions
  - AI histories and usage metadata
  - monitoring, notifications, and reports
                |
       +--------+--------+
       |                 |
       v                 v
Deterministic layer    AI layer
  - search/filter        - summaries
  - rule matching        - translation
  - retrieval            - semantic reranking
  - monitoring           - grounded chat
  - candidate curation   - weekly reports
                         - booklet analysis
       |                 |
       +--------+--------+
                |
                v
Next.js App Router user interface
```

## Data Ingestion

### Etimad list import

The importer fetches a bounded number of public visitor-list pages, validates
the external JSON shape, maps source fields into the internal tender model, and
upserts by stable Etimad identifiers. Repeated imports update existing tenders
instead of creating duplicates.

### Detail enrichment

Public detail pages are fetched separately and only when requested or when a
bounded monitoring run identifies new or changed tenders. Parsed fields and raw
HTML snapshots are stored so extraction problems can be investigated.

### CSV fallback

The staged CSV workflow validates every row before writing. Recognized headers
are mapped automatically, invalid rows remain visible, and valid records use
the same tender upsert boundary as external imports.

### Booklet documents

Conditions booklets are manually uploaded after a tender is shortlisted.
Original PDFs remain local, are identified by a SHA-256 content hash, and are
extracted page by page before any optional AI request.

## Deterministic Before AI

The system first uses normal software:

- PostgreSQL filtering and sorting for discovery
- explainable weighted scoring for company relevance
- deterministic retrieval for chat
- curated candidate selection for AI matching and weekly reports
- stable fingerprints for monitoring and change detection
- local PDF extraction and page selection for booklet analysis

This keeps core workflows useful without AI, reduces cost, and gives AI a
smaller, more relevant context.

## AI Contract

Every AI workflow follows the same boundary:

1. Build a bounded context from stored application data.
2. Request strict structured output.
3. Validate the response schema.
4. Run feature-specific deterministic safety checks.
5. Reject invalid or overclaiming output.
6. Store accepted output with source versions, prompt version, model, token
   usage, and estimated cost.

AI is not allowed to invent tender requirements, confirm eligibility without
evidence, predict winning probability, or imply that a weak contextual overlap
is a company match.

### Feature-specific grounding

- Summaries use normalized stored tender data and optional company-profile data.
- Translations must preserve source meaning without adding explanations.
- Matching reviews at most 10 deterministically selected candidates.
- Chat retrieves at most 20 records and must cite retrieved tenders.
- Weekly reports use at most 20 curated tenders.
- Booklet analysis uses selected extracted pages and requires verified page
  citations for important conclusions.

## Cost Controls

- Paid AI actions are explicit and manual during development.
- Database-backed workspace rate limits constrain paid AI, uploads, imports,
  and monitoring across app instances.
- Routine monitoring and notification matching do not call OpenAI.
- Context sizes and candidate counts are bounded.
- Unchanged summaries, translations, booklets, and analyses can be reused.
- Every accepted generation stores token usage and estimated cost.
- Evaluation scripts make one intentional request at a time.

## Important Trade-Offs

### Simple user-owned workspaces

Each user owns one workspace, and private records are scoped to that workspace
or its company profile. Signed HTTP-only sessions provide authentication;
Next.js Proxy performs an optimistic redirect for private routes, while pages
and Server Actions repeat authorization against the database. Public Etimad
tender discovery remains shared. Enterprise teams, invitations, organization
switching, and role matrices are intentionally deferred.

### Direct model calls instead of an agent framework

Direct API calls make prompts, context, cost, validation, and failure behavior
visible. An agent framework would add complexity without solving a measured
problem in the current workflows.

### No vector database yet

PostgreSQL filters, explicit matching, and bounded retrieval are sufficient for
the current dataset. Embeddings should only be introduced after evaluation
shows a meaningful retrieval gap.

### Conservative external-data automation

Etimad's public endpoints are useful but undocumented. Imports are bounded,
records are cached, raw responses are preserved, and CSV remains a fallback.
Commercial automation would require confirmation of permitted production use.

### Local booklet storage

Local storage is appropriate for the current local-first build. A deployed
version would need private object storage, authorization checks, malware
scanning, retention rules, and deletion workflows.

## Portfolio Deployment Controls

- signed HTTP-only sessions and database authorization
- database-backed limits on expensive and externally dependent actions
- a database health endpoint and structured operational logs
- a secret-protected scheduler endpoint for bounded monitoring
- a guarded reset command for mutable demo activity
- deployment, migration, backup, and recovery procedures in `DEPLOYMENT.md`

## Remaining Production Gaps

Before a commercial public launch, the application still needs:

- hosted PostgreSQL with configured backups and private document storage
- a selected host, alerting provider, and registered production schedule
- review of Etimad production-use permissions
- stronger account lifecycle and operational controls for real customers

Payments, team administration, enterprise SSO, outbound messaging, and
high-availability infrastructure are outside the portfolio-release scope.
