# Milestone 8.5 Translation Evaluation Checklist

AI translation is useful only when it stays faithful to the Arabic source.
Structured output and deterministic checks catch basic failures, but a person
who can read both languages must still review meaning and terminology.

## Evaluation Set

Manually translate approximately 10 representative tenders:

1. A short, clear title with no description.
2. A detailed public description.
3. A title and description that repeat each other.
4. A tender containing official entity names.
5. A tender containing numbers, dates, or reference codes.
6. A tender containing English acronyms inside Arabic text.
7. A tender containing specialized procurement terminology.
8. A sparse or unclear source description.
9. A tender with unusually long public text.
10. A tender whose Arabic title or description changes after translation.

Do not translate the full database automatically during development. Each
translation is a paid API request unless the same source and prompt version are
already cached.

Generate, evaluate, and store one translation by reference number:

```bash
npm run ai:translate:evaluate -- 260639003513
```

## Review Each Output

- The English title and description preserve the source meaning.
- No facts, explanations, requirements, or recommendations were added.
- Nothing important was omitted.
- Official names, numbers, dates, acronyms, and terms remain accurate.
- Repeated or vague Arabic remains repeated or vague rather than being
  silently improved.
- A missing Arabic description produces a null English description.
- English is readable without turning the translation into a summary.

## Deterministic Checks

`src/lib/ai/evaluate-tender-translation.ts` validates the output schema, rejects
an invented description when the source is null, flags an unchanged title, and
checks that Western-Arabic source numbers remain present. Human bilingual review
is still required before trusting translation quality broadly.

## Evaluation Run Log

### 2026-06-13 — Tender 260639003513

- Prompt `tender-translation-v1` translated and stored the repeated Arabic title
  and description without adding content.
- Deterministic checks passed with no issues.
- The request used 197 input tokens and 268 output tokens.
- Estimated cost: `$0.00058525`.
- Human review should still confirm whether “sewage water extraction works” is
  the preferred English procurement phrasing for this service.
