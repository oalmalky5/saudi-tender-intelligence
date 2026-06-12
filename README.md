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

Import that validated page into PostgreSQL using idempotent upserts:

```bash
npm run etimad:import
```

Running the import again updates the existing tenders instead of creating
duplicates.

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
