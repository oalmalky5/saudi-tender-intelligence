# Milestone 9 AI Matching Evaluation Checklist

AI matching ranks a bounded shortlist selected by deterministic scoring. It can
identify semantic relevance and explain nuance, but it cannot confirm
eligibility or predict whether a company will win.

## Cost-Controlled Flow

1. Rule-based matching scores the latest 120 non-ignored tenders.
2. Positive-score candidates are selected first, then remaining slots are
   filled with recent zero-score tenders for semantic exploration.
3. One paid request ranks every supplied candidate.
4. The output is validated before an append-only run is stored.

This improves ranking precision and gives AI a small opportunity to recover
semantic or cross-language matches missed by explicit rules. It still does not
provide full-database semantic recall because each run reviews at most 10 of the
latest 120 non-ignored tenders.

Run one paid evaluation:

```bash
npm run ai:match:evaluate
```

## Review Each Run

- Every supplied candidate appears exactly once.
- The ordering is sensible for the current company profile.
- Scores measure relevance, not eligibility or likelihood of winning.
- Explanations cite facts visible in the supplied public data.
- Limitations are concrete and do not invent hidden requirements.
- Checks distinguish public-data uncertainty from confirmed problems.
- Recommended actions are cautious and useful.
- Confidence reflects the completeness and clarity of public information.
- Arabic source text is understood even when the company profile is English.
- The AI ranking adds useful judgment beyond the deterministic score.

## Deterministic Checks

`src/lib/ai/evaluate-tender-matching.ts` validates the output schema, candidate
coverage, duplicate or unknown IDs, obvious eligibility overclaims, and
unsupported high-confidence outputs without limitations. Human review remains
necessary for relevance quality and factual grounding.

## Evaluation Run Log

### 2026-06-13 — Initial Attempt

- The command stopped before contacting OpenAI because no primary company
  profile exists in the local database.
- No paid API request was made and no matching run was stored.
- Create a representative company profile in `/company` before the first live
  ranking evaluation.

### 2026-06-14 — Catalyft no-match regression

- Prompt `tender-matching-v2` ranked 10 unrelated candidates at 10% or below
  and recommended `IGNORE` for every candidate.
- Deterministic checks passed, but human review found that `whyMatches` still
  described indirect bidder-support possibilities such as registration,
  onboarding, or tender readiness.
- That language was misleading even though the final recommendations were
  correct.
- The evaluator now rejects any candidate without deterministic direct-scope
  evidence when it has non-empty `whyMatches`, a score above 10, or an action
  other than `IGNORE`.
- Prompt `tender-matching-v3` passed the strengthened regression: all 10
  candidates had empty `whyMatches`, scores from 1 to 10, and `IGNORE`
  recommendations.
- The corrected run used 6,078 tokens and cost approximately `$0.00561275`.
