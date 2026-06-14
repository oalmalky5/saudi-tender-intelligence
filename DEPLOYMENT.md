# Deployment and Demo Operations

The application runs as one Next.js service backed by hosted PostgreSQL.
Public tender browsing remains available without sign-in; workspace data and
paid AI actions require an authenticated session.

## Required Production Services

- A Node.js-compatible Next.js host
- Hosted PostgreSQL with automated backups
- A scheduler capable of sending an authenticated HTTP POST request
- An OpenAI API key for AI features
- Private object storage before booklet uploads are enabled for public users

The current booklet implementation stores PDFs on the app filesystem. Many
serverless hosts use ephemeral filesystems, so booklet storage must move to
private object storage before relying on it in production.

## Environment Variables

Set the variables documented in `.env.example`. Production secrets must never
be committed.

- `DATABASE_URL`: production PostgreSQL connection
- `SHADOW_DATABASE_URL`: migration-only connection when needed
- `SESSION_SECRET`: random secret used to sign session cookies
- `CRON_SECRET`: random bearer token for scheduled monitoring
- `MONITOR_WORKSPACE_ID`: workspace monitored by the scheduler
- `DEMO_USER_EMAIL` and `DEMO_USER_PASSWORD`: portfolio demo credentials
- `OPENAI_API_KEY`: server-only OpenAI key
- `AZURE_TRANSLATOR_KEY`: server-only automatic translation key
- `AZURE_TRANSLATOR_ENDPOINT`: Translator REST endpoint
- `AZURE_TRANSLATOR_REGION`: required only for regional or multi-service resources

Generate secrets with `openssl rand -base64 32`.

## Automatic English Translation

Etimad imports and monitoring automatically translate new or changed Arabic
tender titles and public descriptions when Azure Translator is configured.
Source hashes prevent unchanged text from being translated again.

Backfill existing records in controlled batches:

```bash
npm run translate:azure:backfill -- 100
```

The manual OpenAI action remains available as an optional improved translation.

## Build and Database Migration

```bash
npm ci
npx prisma migrate deploy
npm run auth:seed-demo
npm run build
npm run start
```

Run `npx prisma migrate deploy` during deployment, before routing traffic to the
new version. Do not use `prisma db push` against production.

## Health Check

`GET /api/health` checks database connectivity and reports whether session and
OpenAI configuration are present. It never returns secret values.

- HTTP `200`: the database is reachable
- HTTP `503`: the database check failed

Configure the host to alert after repeated `503` responses.

## Scheduled Monitoring

Send an authenticated request on the preferred schedule:

```bash
curl -X POST \
  -H "Authorization: Bearer $CRON_SECRET" \
  https://YOUR_HOST/api/cron/monitor
```

The endpoint runs bounded Etimad discovery and enrichment, writes a
`MonitoringRun`, creates matching notifications, and emits structured JSON
logs. It is rate-limited to protect Etimad and the demo.

## Demo Reset

The reset command removes mutable portfolio-demo activity while preserving the
demo user, company profile, public tender dataset, translations, and uploaded
booklets:

```bash
npm run demo:reset -- --confirm
```

The command only runs for a workspace marked `isDemo`. The explicit `--confirm`
flag prevents accidental resets.

## Backups and Recovery

- Enable daily PostgreSQL backups and point-in-time recovery where available.
- Test a restore before publishing the portfolio URL.
- Keep environment variables in the hosting provider's secret store.
- Do not expose booklet files through a public bucket.
- Review structured logs for `health_check_failed` and
  `scheduled_monitoring_failed`.

## Remaining Production Boundary

This milestone makes the portfolio demo deployable and operable. A real
multi-company launch still requires private object storage, verified Etimad
automation permission, stronger account lifecycle controls, and per-customer
operational policies.
