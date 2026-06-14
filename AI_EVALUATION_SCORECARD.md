# Portfolio AI Evaluation Scorecard

## Purpose

This scorecard provides one reproducible view of the application's AI safety
and grounding controls. It complements feature-specific human review logs; it
does not claim that deterministic checks can measure subjective usefulness or
Arabic-to-English interpretation quality.

Run the scorecard without making any OpenAI requests:

```bash
npm run ai:portfolio:evaluate
```

Audit every real AI output currently stored in the local database against the
latest guardrails:

```bash
npm run ai:stored:audit
```

## Current Deterministic Result

| Measure | Result |
| --- | ---: |
| Total representative scenarios | 16 |
| Scenarios behaving as expected | 16 |
| Valid outputs accepted | 7 |
| Unsafe or unsupported outputs rejected | 9 |
| Paid OpenAI requests | 0 |

## Covered Scenarios

| Feature | Valid behavior demonstrated | Unsafe behavior rejected |
| --- | --- | --- |
| Tender summary | Grounded enriched summary | Missing-data concealment, indirect fit, and unsupported bid actions |
| Translation | Faithful translation preserving source numbers | Invented description and dropped number |
| AI matching | Direct-scope relevance with limitations | Unsupported eligibility claim and indirect bidder-support reasoning |
| Database chat | Cited answer and honest no-match response | Citation outside retrieved evidence |
| Weekly report | Valid zero-match report | Eligibility and winning-probability claim |
| Booklet analysis | Finding with a trusted citation ID | Fabricated citation ID and indirect bidder-support fit |

## Evaluation Layers

```text
Structured-output schema
        |
        v
Feature-specific deterministic guardrails
        |
        v
Reproducible portfolio adversarial scenarios
        |
        v
Human factual and usefulness review
```

The scorecard demonstrates that the application can automatically enforce
important product contracts:

- zero credible matches is accepted as a valid outcome
- unsupported or unretrieved citations are rejected
- booklet citations must match an application-owned citation catalog
- eligibility and winning-probability overclaims are rejected
- translations cannot invent missing descriptions or silently drop source
  numbers
- incomplete tender data must be acknowledged

## What Still Requires Human Review

- whether a recommendation is genuinely useful for the company
- whether an English translation preserves nuanced Arabic meaning
- whether a summary accurately emphasizes the most important facts
- whether cited booklet text has been interpreted correctly
- whether model confidence is appropriately calibrated

Feature-specific evaluation methods and historical live runs remain documented
in `AI_EVALS.md`, `TRANSLATION_EVALS.md`, `AI_MATCH_EVALS.md`,
`CHAT_EVALS.md`, `BOOKLET_EVALS.md`, and `WEEKLY_REPORTS.md`.

## Initial Live Regression Results

| Workflow | Human-review result | Estimated cost |
| --- | --- | ---: |
| Catalyft AI matching `v2` | Correctly ignored all candidates, but used misleading indirect bidder-support language | `$0.00595` |
| Catalyft AI matching `v3` | All 10 candidates had empty `whyMatches`, scores of 1–10, and `IGNORE` actions | `$0.00561` |
| Catalyft weekly report | Explicitly reported zero matches; retained only ignore/risk/deadline market-awareness items | `$0.00548` |
| Tender summary `v3` | Removed some earlier assumptions, but still produced indirect fit notes and unsupported external actions | `$0.00286` |
| Tender summary `v5` | Empty fit notes for the irrelevant company and actions limited to stored-data tracking and monitoring | `$0.00251` |
| Booklet analysis `v2` | Rejected omitted-page and non-verbatim citations | `$0.02415` |
| Booklet analysis `v3` | Rejected 11 non-verbatim citations and indirect company-fit reasoning | `$0.02048` |
| Booklet analysis `v4` | All citations validated; rejected four indirect company-fit notes | `$0.02122` |
| Booklet analysis `v5` | All citations validated; indirect fit removed; honest capability gaps stored | `$0.02050` |

The failed `v2` human review directly produced a new deterministic regression
guardrail and the corrected `v3` prompt. This is the intended evaluation loop:
test, inspect, identify a failure that automated checks missed, encode the
failure as a regression, then rerun.

## Stored Historical Output Audit

`npm run ai:stored:audit` re-evaluates every real stored generation against the
latest guardrails.

Current result:

- 13 stored outputs audited
- 8 pass current guardrails
- 5 historical outputs fail current guardrails
- `$0.059451` total recorded estimated cost
- live coverage across summaries, translation, matching, chat, weekly reports,
  and booklet analysis

The failed outputs are deliberately preserved. They show how the product's
standards evolved and why prompt versioning, append-only generation history,
human review, and regression checks matter.
