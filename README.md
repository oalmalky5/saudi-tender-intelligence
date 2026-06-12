# Etimad Tender Intelligence

An English-first tender discovery and monitoring platform for Saudi government
procurement.

## Foundation Stack

- Next.js App Router
- React and TypeScript
- Tailwind CSS
- Prisma ORM
- Local Prisma Postgres for development

## Local Setup

Install dependencies:

```bash
npm install
```

Start the local database in one terminal:

```bash
npm run db:dev
```

Copy the connection strings printed by Prisma into `.env`, then validate the
Prisma schema and synchronize the current local development database:

```bash
npm run db:validate
npm run db:push
```

Preview and validate one live page of active Etimad tenders without writing to
the database:

```bash
npm run etimad:preview
```

Import up to five validated pages into PostgreSQL using idempotent upserts:

```bash
npm run etimad:import
```

Running the import again updates the existing tenders instead of creating
duplicates.

Manually enrich the next unenriched tender, or provide a reference number:

```bash
npm run etimad:enrich
npm run etimad:enrich -- 260639003513
```

Detail enrichment stores normalized public fields, raw HTML snapshots, and
public attachment metadata without downloading attachment files.

The current local Prisma Postgres server has been reliable for schema push and
application development, but unreliable for Prisma migration-management
commands. The version-controlled migrations will be applied and tested against
standard PostgreSQL when Docker is introduced.

For a standard PostgreSQL database, apply checked-in migrations with:

```bash
npx prisma migrate deploy
```

Start the web application in another terminal:

```bash
npm run dev
```

Open `http://localhost:3000`.

The homepage redirects to `/tenders`, which displays up to 120 real tenders
stored in the local database.

The tender browser supports server-side keyword search, agency/activity/region/
status filters, deadline windows, sorting, and pagination. Search state is
stored in URL query parameters so filtered views can be refreshed or shared.

Tender cards and detail pages support reversible saved/ignored decisions.
Ignored tenders are hidden from default browsing and remain accessible at
`/tenders/saved?view=ignored`. Tender notes are stored locally with decisions.

Create or edit the local company profile at `/company`. Profile list fields
accept comma-separated or one-item-per-line values and will power explainable
tender matching in the next milestone.

## Useful Checks

```bash
npm run lint
npm test
npm run build
npm run db:validate
npm run db:push
```

## Project Documents

- `ROADMAP.md`: product and implementation roadmap
- `MILESTONE_0_ETIMAD_DATA.md`: Etimad data-access investigation
- `LEARNING_NOTES.md`: concepts and decisions learned while building
