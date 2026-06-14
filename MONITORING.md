# Tender Monitoring

Milestone 13 provides an idempotent monitoring command:

```bash
npm run monitor:run
```

The command:

1. Fetches up to five pages from Etimad's public visitor endpoint.
2. Detects new, meaningfully changed, and unchanged tenders.
3. Imports current list data.
4. Enriches at most five new or changed non-UGRP tenders.
5. Scores affected tenders against the primary company profile.
6. Creates explainable in-app notifications, deadline reminders, digests, and
   monitoring warnings.
7. Stores a monitoring-run log.
8. Automatically translates new or changed Arabic tender titles and public
   descriptions when Azure Translator is configured.

## Scheduling

The command is ready to be invoked locally by cron. Hosted schedulers should
send an authenticated `POST` request to `/api/cron/monitor` using
`Authorization: Bearer $CRON_SECRET`. See `DEPLOYMENT.md` for the full setup.

A local cron entry would need to change into the repository directory and run
the command, for example:

```cron
0 */6 * * * cd /Users/omarm/Desktop/projects/etimad-ai && npm run monitor:run
```

That example runs every six hours. Before registering it, decide where logs
should be written and ensure the local PostgreSQL development database is
running.

## Cost

Routine monitoring and notifications use deterministic matching and do not
make paid OpenAI requests. Azure Translator handles automatic browsing
translations within its configured allowance. OpenAI translation improvement,
AI matching, summaries, chat, and booklet analysis remain explicit actions.

## Current Limits

- The scan is intentionally bounded to five list pages and five detail
  enrichments per run.
- Notifications are in-app only.
- Digests are in-app summary notifications, not email reports.
- The final scheduler registration depends on the selected hosting provider.
