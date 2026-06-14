import Link from "next/link";

import { LanguageSwitcher } from "@/app/language-switcher";
import { weeklyTenderReportSchema } from "@/lib/ai/weekly-report-schema";
import { dateLocale, pick, type Locale } from "@/lib/i18n/locale";
import { getLocale } from "@/lib/i18n/locale-server";
import { localizedTenderText } from "@/lib/i18n/tender-text";
import { prisma } from "@/lib/prisma";
import { requireWorkspace } from "@/lib/auth/session";

import { WeeklyReportControls } from "./report-controls";

export const dynamic = "force-dynamic";

function formatDate(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(dateLocale(locale), {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Riyadh",
  }).format(date);
}

function dateInputValue(date: Date): string {
  const riyadh = new Date(date.getTime() + 3 * 60 * 60 * 1_000);
  return riyadh.toISOString().slice(0, 10);
}

function ListSection({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <section>
      <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--accent)]">{title}</h3>
      <ul className="mt-3 grid gap-2 text-sm leading-6 text-[var(--muted)]">
        {items.map((item) => <li key={item}>- {item}</li>)}
      </ul>
    </section>
  );
}

export default async function WeeklyReportsPage() {
  const { workspace } = await requireWorkspace();
  const profileId = workspace.companyProfile?.id ?? "";
  const locale = await getLocale();
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1_000);
  const [profile, reports] = await Promise.all([
    prisma.companyProfile.findUnique({ where: { workspaceId: workspace.id } }),
    prisma.weeklyTenderReport.findMany({
      where: { companyProfileId: profileId },
      orderBy: { generatedAt: "desc" },
      take: 10,
      include: {
        tenders: {
          include: {
            tender: {
              select: {
                id: true,
                referenceNumber: true,
                titleArabic: true,
                titleEnglish: true,
                agencyNameArabic: true,
                updatedAt: true,
              },
            },
          },
        },
      },
    }),
  ]);

  return (
    <main className="min-h-screen">
      <header className="border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
          <Link href="/tenders" className="font-semibold hover:text-[var(--accent)]">
            <span className="rtl-flip inline-block">←</span>{" "}
            {pick(locale, "Tender browser", "متصفح المنافسات")}
          </Link>
          <LanguageSwitcher locale={locale} />
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <section>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
            {pick(locale, "Weekly tender reports", "تقارير المنافسات الأسبوعية")}
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
            {pick(locale, "Review your weekly tender report.", "راجع تقرير المنافسات الأسبوعي.")}
          </h1>
          <p className="mt-4 max-w-3xl leading-7 text-[var(--muted)]">
            {pick(locale, "The report prioritizes relevant opportunities, urgent deadlines, material risks, unsuitable tenders, and practical next review steps using only stored public data.", "يرتب التقرير الفرص المناسبة والمواعيد العاجلة والمخاطر المهمة والمنافسات غير المناسبة وخطوات المراجعة التالية باستخدام البيانات العامة المخزنة فقط.")}
          </p>
        </section>

        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">{pick(locale, "Stored reports", "التقارير المحفوظة")}</p>
            <p className="mt-2 text-3xl font-semibold">{reports.length}</p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">{pick(locale, "Company profile", "ملف الشركة")}</p>
            <p className="mt-2 font-semibold">{profile?.companyName ?? pick(locale, "Not configured", "غير مُعد")}</p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--accent-soft)] p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--accent)]">{pick(locale, "Latest report", "أحدث تقرير")}</p>
            <p className="mt-2 font-semibold">{reports[0] ? formatDate(reports[0].generatedAt, locale) : pick(locale, "Generate your first report", "أنشئ تقريرك الأول")}</p>
          </div>
        </section>

        {!profile ? (
          <section className="mt-8 rounded-3xl border border-dashed border-[var(--border-strong)] bg-white px-6 py-16 text-center">
            <h2 className="text-xl font-semibold">{pick(locale, "Create a company profile first", "أنشئ ملف الشركة أولاً")}</h2>
            <Link href="/company" className="mt-5 inline-flex rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white">
              {pick(locale, "Create profile", "إنشاء ملف")}
            </Link>
          </section>
        ) : (
          <section className="mt-8 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8">
            <WeeklyReportControls
              locale={locale}
              defaultFrom={dateInputValue(sevenDaysAgo)}
              defaultTo={dateInputValue(now)}
            />
          </section>
        )}

        <section className="mt-10 grid gap-7">
          {reports.length === 0 && (
            <p className="rounded-3xl border border-dashed border-[var(--border-strong)] bg-white p-12 text-center text-[var(--muted)]">
              {pick(locale, "No weekly reports have been generated yet.", "لم يتم إنشاء تقارير أسبوعية بعد.")}
            </p>
          )}
          {reports.map((report) => {
            const parsed = weeklyTenderReportSchema.safeParse(report.content);
            const tenderById = new Map(
              report.tenders.map((entry) => [entry.tender.id, entry.tender]),
            );
            const isStale =
              profile !== null &&
              (profile.updatedAt > report.sourceCompanyProfileUpdatedAt ||
                report.tenders.some(
                  (entry) => entry.tender.updatedAt > entry.sourceTenderUpdatedAt,
                ));

            return (
              <article key={report.id} className="rounded-3xl border border-[var(--border)] bg-white p-6 sm:p-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--accent)]">
                      {formatDate(report.dateFrom, locale)} – {formatDate(report.dateTo, locale)}
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold">{profile?.companyName ?? "Weekly tender report"}</h2>
                  </div>
                  {isStale && <span className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-800">Stale: profile or tender data changed</span>}
                </div>

                {parsed.success ? (
                  <>
                    <p className="mt-6 whitespace-pre-wrap leading-7 text-[var(--muted)]">{parsed.data.executiveSummary}</p>
                    <div className="mt-7 grid gap-6 md:grid-cols-3">
                      <ListSection title="Market signals" items={parsed.data.marketSignals} />
                      <ListSection title="Recommended actions" items={parsed.data.recommendedActions} />
                      <ListSection title="Limitations" items={parsed.data.limitations} />
                    </div>
                    <div className="mt-8 grid gap-4">
                      {parsed.data.tenderReviews.map((review) => {
                        const tender = tenderById.get(review.tenderId);
                        if (!tender) return null;
                        const title = localizedTenderText(locale, tender.titleEnglish, tender.titleArabic);
                        return (
                          <section key={review.tenderId} className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-xs text-[var(--muted)]">Ref. {tender.referenceNumber} · {tender.agencyNameArabic}</p>
                                <Link href={`/tenders/${tender.id}`} className="mt-1 block text-lg font-semibold hover:text-[var(--accent)]">{title.value}</Link>
                              </div>
                              <span className="text-xl font-semibold text-[var(--accent)]">{review.relevanceScore}%</span>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {review.categories.map((category) => <span key={category} className="rounded-full bg-white px-3 py-1 text-xs font-semibold">{category.replaceAll("_", " ")}</span>)}
                            </div>
                            <p className="mt-4 text-sm leading-6 text-[var(--muted)]">{review.rationale}</p>
                            {review.risks.length > 0 && <ListSection title="Risks" items={review.risks} />}
                            <p className="mt-4 text-sm font-semibold">Next action: {review.recommendedAction}</p>
                          </section>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <p className="mt-5 text-sm text-red-700">Stored report does not match the current schema.</p>
                )}

                <details className="mt-7 border-t border-[var(--border)] pt-5">
                  <summary className="cursor-pointer text-sm font-semibold">View generated Markdown</summary>
                  <pre className="mt-4 max-h-[32rem] overflow-auto whitespace-pre-wrap rounded-2xl bg-[var(--foreground)] p-5 text-xs leading-6 text-white">{report.markdown}</pre>
                </details>
                <p className="mt-5 text-xs text-[var(--muted)]">
                  Generated {formatDate(report.generatedAt, locale)} · {report.candidateCount} candidates · {report.model} · {report.promptVersion} · {report.totalTokens ?? "unknown"} tokens
                  {report.estimatedCostUsd ? ` · Estimated cost $${report.estimatedCostUsd.toString()}` : ""}
                </p>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}
