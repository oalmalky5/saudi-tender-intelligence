# Milestone 11 Tender Database Chat Evaluation Checklist

Tender database chat is grounded question answering over retrieved local tender
records. It is not a general Etimad assistant and cannot access records that
were not retrieved for the question.

## Retrieval Modes

- Closing-soon questions retrieve tenders with deadlines in the next 7 or 14
  days.
- Questions containing reference numbers retrieve those exact tenders.
- Company-fit questions deterministically rank the latest 120 non-ignored
  tenders and retrieve the top 20.
- Keyword questions search Arabic and English normalized tender fields.
- Questions without useful retrieval signals fall back to the 20 most recent
  non-ignored tenders.

Each question makes at most one paid AI request over at most 20 records.

## Evaluation Questions

1. What tenders are closing this week?
2. Show ICT tenders in Riyadh.
3. Which tenders fit this company profile?
4. Compare two existing tender reference numbers.
5. Compare one existing and one nonexistent reference number.
6. Which tenders look risky?
7. What are the hidden eligibility requirements for a tender without a booklet?
8. Ask about a topic absent from the database.

## Review Each Answer

- Every factual tender claim links to a retrieved tender.
- The answer does not cite unretrieved or invented tender IDs.
- Dates and fields match the tender detail page.
- Company-fit answers distinguish relevance from eligibility.
- Company-fit answers require direct evidence that the company itself could
  deliver the tender's requested scope.
- Public-sector context, SME preference, geography, target entities, or the
  ability to help another bidder do not count as company fit by themselves.
- The assistant clearly reports when no credible matches are found instead of
  filling the answer with marginal suggestions.
- Hidden or missing information is acknowledged instead of invented.
- Empty or insufficient retrieval produces an explicit unsupported answer.
- Caveats clearly explain retrieval limitations.
- The answer is concise and directly addresses the question.

## Deterministic Checks

`src/lib/ai/evaluate-tender-chat.ts` validates the structured output, requires
citations for supported answers, rejects citations outside retrieval, enforces
unsupported answers when retrieval is empty, and catches obvious eligibility
or winning-probability overclaims. Human review remains necessary for factual
grounding and usefulness.

## Evaluation Run Log

### 2026-06-13 — “What tenders are closing this week?”

- Prompt `tender-chat-v1` passed deterministic checks and cost an estimated
  `$0.0071885`, but exposed internal database IDs in answer prose and did not
  clearly disclose that the 20-record cap made the list non-exhaustive.
- Prompt `tender-chat-v2` identifies tenders using public reference numbers,
  explicitly warns when the retrieval limit is reached, and passed all
  deterministic checks.
- The `v2` run retrieved 20 closing-soon tenders, used 8,321 total tokens, and
  cost an estimated `$0.0072515`.

### 2026-06-13 — Catalyft company-fit false positives

- Prompt `tender-chat-v2` incorrectly recommended maintenance, equipment,
  sewage, and construction tenders because Catalyft could theoretically help
  another supplier with registration or bid readiness.
- The deterministic matcher also matched the short keyword `CR` inside `PCR`
  and `MICRON`.
- Direct-scope matching now separates deliverable evidence from contextual
  overlap. Company-fit retrieval returns only tenders with direct scope
  evidence and treats zero credible matches as a valid result.
- Prompt `tender-chat-v3` explicitly forbids treating indirect bidder support,
  SME preference, public-sector context, target entities, or geography as
  sufficient fit evidence.
- The live `v3` regression run returned zero tenders and correctly produced an
  unsupported no-match answer with no citations. It used 1,716 tokens and cost
  approximately `$0.00093475`.
- Prompt `tender-chat-v4` further requires the answer to explain that the
  latest 120 tenders were scanned, rather than inaccurately implying that no
  database search occurred.
