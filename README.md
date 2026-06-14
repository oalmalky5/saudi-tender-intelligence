# Etimad Tender Intelligence

An English-first tender intelligence platform for Saudi government
procurement. It imports real public Etimad tenders, makes them easier to
discover, explains company relevance, and uses grounded AI for summaries,
translation, document analysis, database chat, and weekly decision reports.

This repository is currently a local-first portfolio product. It demonstrates
the complete workflow and the engineering decisions behind it; it is not an
official Etimad integration or a production Catalyft service.

## Why It Exists

Etimad publishes valuable procurement opportunities, but discovering relevant
tenders requires navigating Arabic-first records, scattered public details,
and detailed conditions booklets. Etimad Tender Intelligence turns that
workflow into a clearer decision process:

1. Ingest and normalize public Etimad tender data.
2. Search, filter, save, ignore, and track opportunities.
3. Describe a company using non-sensitive profile information.
4. Rank tenders using explainable rules and bounded AI review.
5. Investigate shortlisted tenders through grounded summaries and cited
   booklet analysis.
6. Monitor changes and produce a weekly action report.

## Product Highlights

- Real public Etimad data with idempotent imports and detail enrichment
- English/Arabic interface with on-demand English tender translation
- Explainable deterministic matching before paid AI matching
- Explicit no-match behavior instead of forced recommendations
- Grounded tender summaries and database chat with source references
- On-demand Arabic PDF booklet analysis with page citations
- New/changed tender monitoring and in-app notifications
- Weekly company-specific tender reports
- Structured AI outputs, deterministic checks, evaluation logs, and cost
  tracking
- Responsive interface with accessible motion and clear loading/empty states

## Architecture At A Glance

```text
Etimad public data / CSV
          |
          v
 validation + normalization + idempotent upsert
          |
          v
       PostgreSQL
       /    |    \
 search  matching  monitoring
   |        |         |
   +--------+---------+
            |
   bounded grounded AI calls
 summaries / translation / matching / chat / reports / booklet analysis
            |
   validated stored outputs + usage metadata
```

The application uses deterministic retrieval and scoring before AI. Model
outputs are structured, validated, stored with source versions, and rejected
when they violate important grounding rules. See [ARCHITECTURE.md](ARCHITECTURE.md)
for the full data flow and trade-offs.

## Technology

- Next.js 16 App Router, React 19, and TypeScript
- PostgreSQL with Prisma ORM
- Zod validation at external-data and AI-output boundaries
- Direct OpenAI Responses API calls without an agent framework
- Local PDF extraction with `pdfjs-dist`
- Node test runner through `tsx --test`

## Local Setup

### Prerequisites

- Node.js 20 or newer
- npm
- PostgreSQL, or Prisma's local development database
- An OpenAI API key only for manually triggered AI features

### 1. Install and configure

```bash
npm install
cp .env.example .env
```

Start Prisma's local PostgreSQL development database in a separate terminal:

```bash
npm run db:dev
```

Copy the printed connection strings into `.env`, then prepare the database:

```bash
npm run db:validate
npm run db:push
```

For a standard PostgreSQL environment, use the checked-in migrations:

```bash
npx prisma migrate deploy
```

### 2. Add demo data

Import a bounded sample of real active tenders:

```bash
npm run etimad:import
```

Add the non-sensitive demonstration company profile:

```bash
npm run demo:seed
```

The seed command refuses to overwrite an existing primary profile. To
deliberately replace it:

```bash
npm run demo:seed -- --replace
```

Optionally enrich a tender's public details:

```bash
npm run etimad:enrich
npm run etimad:enrich -- 260639003513
```

### 3. Run the application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## AI Configuration And Cost Controls

Add the API key only when testing AI features:

```bash
OPENAI_API_KEY="your-api-key"
```

The key remains server-side and must never use a `NEXT_PUBLIC_` prefix. Every
paid feature is manually triggered during development, uses a bounded context,
logs token usage and estimated cost, and stores validated output.

Model overrides are documented in [.env.example](.env.example). Without
overrides, the application uses its configured mini-model defaults.

## Main Workflows

| Workflow | Route or command |
| --- | --- |
| Discover and filter tenders | `/tenders` |
| Create the company profile | `/company` |
| Review deterministic and AI matches | `/tenders/recommended` |
| Ask grounded database questions | `/chat` |
| Review notifications and run monitoring | `/notifications` |
| Generate a weekly decision brief | `/reports/weekly` |
| Import CSV records | `/admin/import` |
| Preview Etimad data without writing | `npm run etimad:preview` |
| Run the monitoring job | `npm run monitor:run` |

Tender detail pages contain enrichment, decisions, translation, AI summary,
and booklet upload/analysis workflows.

## Verification

Run the full repository check before committing:

```bash
npm run check
```

Or run checks individually:

```bash
npm run lint
npm test
npm run db:validate
npm run build
```

The build requires a reachable database because the current application
renders database-backed routes during production verification.

## Grounding And Product Boundaries

- Relevance is not eligibility.
- Public tender data cannot confirm hidden booklet requirements.
- AI may only use records supplied by the application.
- Important booklet conclusions require page citations.
- Zero credible matches is a valid and expected result.
- Routine monitoring uses deterministic matching and no paid AI calls.
- Etimad public endpoints are undocumented and treated conservatively.
- Booklets must be obtained and uploaded through the user's authorized access.

## Repository Guide

- [ARCHITECTURE.md](ARCHITECTURE.md): system design, data flow, AI boundaries,
  and trade-offs
- [ROADMAP.md](ROADMAP.md): completed and remaining milestones
- [MILESTONE_0_ETIMAD_DATA.md](MILESTONE_0_ETIMAD_DATA.md): Etimad data-access
  investigation
- [LEARNING_NOTES.md](LEARNING_NOTES.md): concepts and decisions learned while
  building
- `*_EVALS.md`: AI evaluation methods and representative run logs
- [MONITORING.md](MONITORING.md): monitoring behavior and scheduling boundary
- [WEEKLY_REPORTS.md](WEEKLY_REPORTS.md): weekly-report pipeline and limits

## Deliberately Deferred

The portfolio release does not include payments, organization teams, complex
permissions, SSO, outbound SMS/WhatsApp, proposal generation, microservices, or
large-scale infrastructure. These are commercial SaaS concerns that would not
materially strengthen the current engineering demonstration.
