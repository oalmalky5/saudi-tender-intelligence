import { tenderAiSummarySchema, type TenderAiSummaryContent } from "@/lib/ai/tender-summary-schema";
import { dateLocale, pick, type Locale } from "@/lib/i18n/locale";

import { SummaryControls } from "./summary-controls";

type StoredSummary = {
  id: string;
  content: unknown;
  model: string;
  promptVersion: string;
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
  estimatedCostUsd: { toString(): string } | null;
  sourceTenderUpdatedAt: Date;
  sourceCompanyProfileUpdatedAt: Date | null;
  companyProfileId: string | null;
  generatedAt: Date;
};

function SummaryList({
  title,
  items,
  locale,
}: {
  title: string;
  items: string[];
  locale: Locale;
}) {
  return (
    <div>
      <h3 className="font-semibold">{title}</h3>
      {items.length ? (
        <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-6 text-[var(--muted)]">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-[var(--muted)]">
          {pick(locale, "None identified.", "لم يتم تحديد أي عناصر.")}
        </p>
      )}
    </div>
  );
}

function SummaryContent({
  content,
  locale,
}: {
  content: TenderAiSummaryContent;
  locale: Locale;
}) {
  return (
    <>
      <p className="mt-4 leading-7 text-[var(--muted)]">{content.summary}</p>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <SummaryList locale={locale} title={pick(locale, "Requirements", "المتطلبات")} items={content.requirements} />
        <SummaryList locale={locale} title={pick(locale, "Deadline notes", "ملاحظات المواعيد")} items={content.deadlineNotes} />
        <SummaryList locale={locale} title={pick(locale, "Risks", "المخاطر")} items={content.risks} />
        <SummaryList locale={locale} title={pick(locale, "Company fit notes", "ملاحظات ملاءمة الشركة")} items={content.fitNotes} />
        <SummaryList locale={locale} title={pick(locale, "Questions to ask", "أسئلة يجب طرحها")} items={content.questionsToAsk} />
        <SummaryList locale={locale} title={pick(locale, "Next actions", "الخطوات التالية")} items={content.nextActions} />
        <SummaryList
          locale={locale}
          title={pick(locale, "Missing information", "المعلومات الناقصة")}
          items={content.missingInformation}
        />
      </div>
    </>
  );
}

export function TenderSummaryPanel({
  tenderId,
  tenderUpdatedAt,
  currentCompanyProfile,
  summaries,
  locale,
}: {
  tenderId: string;
  tenderUpdatedAt: Date;
  currentCompanyProfile: { id: string; updatedAt: Date } | null;
  summaries: StoredSummary[];
  locale: Locale;
}) {
  const dateFormatter = new Intl.DateTimeFormat(dateLocale(locale), {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Riyadh",
  });
  const latest = summaries[0] ?? null;
  const parsedLatest = latest
    ? tenderAiSummarySchema.safeParse(latest.content)
    : null;
  const isStale =
    latest !== null &&
    (tenderUpdatedAt > latest.sourceTenderUpdatedAt ||
      (currentCompanyProfile?.id ?? null) !== latest.companyProfileId ||
      (currentCompanyProfile !== null &&
        (latest.sourceCompanyProfileUpdatedAt === null ||
          currentCompanyProfile.updatedAt >
            latest.sourceCompanyProfileUpdatedAt)));

  return (
    <section className="mt-6 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <h2 className="text-xl font-semibold">
            {pick(locale, "AI tender summary", "ملخص المنافسة بالذكاء الاصطناعي")}
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            {pick(
              locale,
              "Generated manually from stored public tender data. It supports review, but does not confirm eligibility or predict success.",
              "يُنشأ يدوياً من بيانات المنافسة العامة المخزنة. يساعد في المراجعة، لكنه لا يؤكد الأهلية ولا يتنبأ بالفوز.",
            )}
          </p>
        </div>
        <SummaryControls tenderId={tenderId} locale={locale} />
      </div>

      {!latest && (
        <p className="mt-6 rounded-2xl bg-[var(--background)] p-5 text-sm text-[var(--muted)]">
          {pick(locale, "No AI summary has been generated for this tender yet.", "لم يتم إنشاء ملخص بالذكاء الاصطناعي لهذه المنافسة بعد.")}
        </p>
      )}

      {latest && (
        <div className="mt-6 border-t border-[var(--border)] pt-6">
          <div className="flex flex-wrap gap-2 text-xs font-medium">
            <span className="rounded-full bg-[var(--background)] px-3 py-1.5 text-[var(--muted)]">
              {pick(locale, "Generated", "تم الإنشاء")} {dateFormatter.format(latest.generatedAt)}
            </span>
            <span className="rounded-full bg-[var(--background)] px-3 py-1.5 text-[var(--muted)]">
              {latest.model} · {latest.promptVersion}
            </span>
            {isStale && (
              <span className="rounded-full bg-amber-100 px-3 py-1.5 text-amber-800">
                {pick(locale, "Stale: tender or company profile changed", "قديم: تغيرت المنافسة أو بيانات الشركة")}
              </span>
            )}
          </div>

          {parsedLatest?.success ? (
            <SummaryContent content={parsedLatest.data} locale={locale} />
          ) : (
            <p className="mt-4 text-sm text-red-700">
              {pick(locale, "This stored summary does not match the current output schema.", "هذا الملخص المخزن لا يطابق بنية المخرجات الحالية.")}
            </p>
          )}

          <p className="mt-6 text-xs leading-5 text-[var(--muted)]">
            {pick(locale, "Usage", "الاستخدام")}: {latest.inputTokens ?? pick(locale, "unknown", "غير معروف")} {pick(locale, "input tokens", "رموز إدخال")} ·{" "}
            {latest.outputTokens ?? pick(locale, "unknown", "غير معروف")} {pick(locale, "output tokens", "رموز إخراج")} ·{" "}
            {latest.totalTokens ?? pick(locale, "unknown", "غير معروف")} {pick(locale, "total tokens", "إجمالي الرموز")}
            {latest.estimatedCostUsd
              ? ` · ${pick(locale, "Estimated cost", "التكلفة التقديرية")} $${latest.estimatedCostUsd.toString()}`
              : ""}
            {" · "}
            {summaries.length} {pick(locale, summaries.length === 1 ? "stored version" : "stored versions", "نسخ مخزنة")}
          </p>

          {summaries.length > 1 && (
            <details className="mt-5 border-t border-[var(--border)] pt-5">
              <summary className="cursor-pointer text-sm font-semibold">
                {pick(locale, "View generation history", "عرض سجل الإنشاء")}
              </summary>
              <ol className="mt-3 space-y-2 text-xs text-[var(--muted)]">
                {summaries.map((summary, index) => (
                  <li key={summary.id}>
                    {pick(locale, "Version", "الإصدار")} {summaries.length - index}:{" "}
                    {dateFormatter.format(summary.generatedAt)} · {summary.model} ·{" "}
                    {summary.totalTokens ?? pick(locale, "unknown", "غير معروف")} {pick(locale, "tokens", "رمز")}
                  </li>
                ))}
              </ol>
            </details>
          )}
        </div>
      )}
    </section>
  );
}
