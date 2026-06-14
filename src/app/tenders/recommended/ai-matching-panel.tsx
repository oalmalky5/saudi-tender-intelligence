import { dateLocale, pick, type Locale } from "@/lib/i18n/locale";
import { localizedTenderText } from "@/lib/i18n/tender-text";
import Link from "next/link";

import { AiMatchingControls } from "./ai-matching-controls";

type StoredRun = {
  id: string;
  model: string;
  promptVersion: string;
  candidateCount: number;
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
  estimatedCostUsd: { toString(): string } | null;
  sourceCompanyProfileUpdatedAt: Date;
  generatedAt: Date;
  matches: Array<{
    id: string;
    rank: number;
    relevanceScore: number;
    whyMatches: string[];
    whyMayNotMatch: string[];
    whatToCheckNext: string[];
    recommendedAction: string;
    confidence: string;
    deterministicScore: number;
    sourceTenderUpdatedAt: Date;
    tender: {
      id: string;
      referenceNumber: string;
      titleArabic: string;
      titleEnglish: string | null;
      agencyNameArabic: string;
      updatedAt: Date;
    };
  }>;
};

function MatchList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
        {title}
      </p>
      <ul className="mt-1.5 grid gap-1 text-sm leading-6">
        {items.map((item) => (
          <li key={item}>- {item}</li>
        ))}
      </ul>
    </div>
  );
}

export function AiMatchingPanel({
  locale,
  profileUpdatedAt,
  run,
}: {
  locale: Locale;
  profileUpdatedAt: Date;
  run: StoredRun | null;
}) {
  const dateFormatter = new Intl.DateTimeFormat(dateLocale(locale), {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Riyadh",
  });
  const isStale =
    run !== null &&
    (profileUpdatedAt > run.sourceCompanyProfileUpdatedAt ||
      run.matches.some(
        (match) => match.tender.updatedAt > match.sourceTenderUpdatedAt,
      ));

  return (
    <section className="mt-8 rounded-3xl border border-[var(--border)] bg-white p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
            {pick(locale, "AI-ranked shortlist", "قائمة مختصرة مرتبة بالذكاء الاصطناعي")}
          </p>
          <h2 className="mt-2 text-2xl font-semibold">
            {pick(locale, "Semantic relevance review", "مراجعة الصلة الدلالية")}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            {pick(
              locale,
              "One paid request reviews at most 10 candidates: rule-based matches first, then recent exploration candidates when space remains. Scores indicate relevance from public data, not eligibility or likelihood of winning.",
              "يراجع طلب مدفوع واحد 10 مرشحين كحد أقصى: المطابقات القائمة على القواعد أولاً، ثم منافسات حديثة للاستكشاف عند توفر مساحة. تشير الدرجات إلى الصلة وفق البيانات العامة، لا إلى الأهلية أو احتمال الفوز.",
            )}
          </p>
        </div>
        <AiMatchingControls locale={locale} hasRun={run !== null} />
      </div>

      {!run && (
        <p className="mt-6 rounded-2xl bg-[var(--background)] p-5 text-sm text-[var(--muted)]">
          {pick(locale, "No AI shortlist has been generated yet.", "لم يتم إنشاء قائمة مختصرة بالذكاء الاصطناعي بعد.")}
        </p>
      )}

      {run && (
        <>
          <div className="mt-6 flex flex-wrap gap-2 text-xs font-medium">
            <span className="rounded-full bg-[var(--background)] px-3 py-1.5 text-[var(--muted)]">
              {pick(locale, "Generated", "تم الإنشاء")} {dateFormatter.format(run.generatedAt)}
            </span>
            <span className="rounded-full bg-[var(--background)] px-3 py-1.5 text-[var(--muted)]">
              {run.model} · {run.promptVersion}
            </span>
            {isStale && (
              <span className="rounded-full bg-amber-100 px-3 py-1.5 text-amber-800">
                {pick(locale, "Stale: profile or tender data changed", "قديم: تغير ملف الشركة أو بيانات المنافسة")}
              </span>
            )}
          </div>

          <div className="mt-6 grid gap-4">
            {run.matches.map((match) => {
              const title = localizedTenderText(
                locale,
                match.tender.titleEnglish,
                match.tender.titleArabic,
              );

              return (
                <article
                  key={match.id}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5"
                >
                  <div className="grid gap-5 lg:grid-cols-[5rem_minmax(0,1fr)]">
                    <div className="text-center">
                      <p className="text-xs font-semibold text-[var(--muted)]">
                        #{match.rank}
                      </p>
                      <p className="mt-1 text-2xl font-semibold text-[var(--accent)]">
                        {match.relevanceScore}%
                      </p>
                      <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                        {match.confidence} {pick(locale, "confidence", "ثقة")}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--muted)]">
                        {pick(locale, "Ref.", "المرجع")} {match.tender.referenceNumber} ·{" "}
                        {pick(locale, "Rule score", "درجة القواعد")} {match.deterministicScore}%
                      </p>
                      <Link
                        href={`/tenders/${match.tender.id}`}
                        dir={title.direction}
                        lang={title.language}
                        className={`mt-1 block text-lg font-semibold leading-7 hover:text-[var(--accent)] ${
                          title.direction === "rtl" ? "text-right" : ""
                        }`}
                      >
                        {title.value}
                      </Link>
                      <p dir="rtl" lang="ar" className="mt-1 text-right text-sm text-[var(--muted)]">
                        {match.tender.agencyNameArabic}
                      </p>
                      <div className="mt-4 grid gap-4 md:grid-cols-3">
                        <MatchList title={pick(locale, "Why it matches", "أسباب المطابقة")} items={match.whyMatches} />
                        <MatchList title={pick(locale, "Why it may not match", "أسباب عدم المطابقة المحتملة")} items={match.whyMayNotMatch} />
                        <MatchList title={pick(locale, "What to check next", "ما يجب التحقق منه تالياً")} items={match.whatToCheckNext} />
                      </div>
                      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--accent)]">
                        {pick(locale, "Suggested action", "الإجراء المقترح")}: {match.recommendedAction.replaceAll("_", " ")}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <p className="mt-5 text-xs leading-5 text-[var(--muted)]">
            {run.candidateCount} {pick(locale, "candidates reviewed", "مرشحين تمت مراجعتهم")} ·{" "}
            {run.totalTokens ?? pick(locale, "unknown", "غير معروف")} {pick(locale, "tokens", "رمز")}
            {run.estimatedCostUsd
              ? ` · ${pick(locale, "Estimated cost", "التكلفة التقديرية")} $${run.estimatedCostUsd.toString()}`
              : ""}
          </p>
        </>
      )}
    </section>
  );
}
