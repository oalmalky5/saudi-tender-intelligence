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

## Scheduling

The command is ready to be invoked by cron or a hosted scheduler. It is not
automatically registered on the development machine because the desired
frequency and final runtime have not been selected.

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
make paid OpenAI requests. AI matching, summaries, translations, chat, and
booklet analysis remain explicit separate actions.

## Current Limits

- The scan is intentionally bounded to five list pages and five detail
  enrichments per run.
- Notifications are in-app only.
- Digests are in-app summary notifications, not email reports.
- Scheduler registration is deferred until the runtime environment is chosen.
