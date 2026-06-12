import { prisma } from "@/lib/prisma";
import {
  buildTenderOrderBy,
  buildTenderWhere,
  parseTenderSearchParams,
  TENDERS_PER_PAGE,
  type TenderSearch,
  type TenderSearchParams,
} from "@/lib/tenders/search";
import Link from "next/link";
import { DecisionControls } from "./decision-controls";
import { LanguageSwitcher } from "@/app/language-switcher";
import { dateLocale, pick, type Locale } from "@/lib/i18n/locale";
import { getLocale } from "@/lib/i18n/locale-server";
import { localizedTenderText } from "@/lib/i18n/tender-text";

export const dynamic = "force-dynamic";

function formatDate(date: Date | null, locale: Locale): string {
  return date
    ? new Intl.DateTimeFormat(dateLocale(locale), {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Riyadh",
      }).format(date)
    : pick(locale, "Not provided", "غير متاح");
}

function buildPageHref(search: TenderSearch, page: number): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(search)) {
    if (key !== "page" && value && value !== "any" && value !== "published-desc") {
      params.set(key, String(value));
    }
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const query = params.toString();
  return query ? `/tenders?${query}` : "/tenders";
}

function FilterSelect({
  label,
  name,
  defaultValue,
  options,
  allLabel,
}: {
  label: string;
  name: string;
  defaultValue: string;
  options: string[];
  allLabel: string;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-medium">
      {label}
      <select
        name={name}
        defaultValue={defaultValue}
        className="min-w-0 rounded-xl border border-[var(--border)] bg-white px-3 py-2.5 font-normal outline-none focus:border-[var(--accent)]"
      >
        <option value="">{allLabel}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

export default async function TendersPage({
  searchParams,
}: {
  searchParams: Promise<TenderSearchParams>;
}) {
  const search = parseTenderSearchParams(await searchParams);
  const locale = await getLocale();
  const searchWhere = buildTenderWhere(search);
  const where = {
    AND: [
      searchWhere,
      { NOT: { decision: { is: { status: "IGNORED" as const } } } },
    ],
  };
  const orderBy = buildTenderOrderBy(search.sort);

  const [tenders, resultCount, agencies, activities, regions, statuses] =
    await Promise.all([
      prisma.tender.findMany({
        where,
        orderBy,
        skip: (search.page - 1) * TENDERS_PER_PAGE,
        take: TENDERS_PER_PAGE,
        select: {
          id: true,
          referenceNumber: true,
          titleArabic: true,
          titleEnglish: true,
          agencyNameArabic: true,
          branchNameArabic: true,
          activityNameArabic: true,
          tenderTypeNameArabic: true,
          tenderStatusNameArabic: true,
          executionRegionArabic: true,
          publishedAt: true,
          submissionDeadline: true,
          sourceUrl: true,
          detailEnrichmentStatus: true,
          decision: { select: { status: true } },
        },
      }),
      prisma.tender.count({ where }),
      prisma.tender.findMany({
        distinct: ["agencyNameArabic"],
        orderBy: { agencyNameArabic: "asc" },
        select: { agencyNameArabic: true },
      }),
      prisma.tender.findMany({
        where: { activityNameArabic: { not: null } },
        distinct: ["activityNameArabic"],
        orderBy: { activityNameArabic: "asc" },
        select: { activityNameArabic: true },
      }),
      prisma.tender.findMany({
        where: { executionRegionArabic: { not: null } },
        distinct: ["executionRegionArabic"],
        orderBy: { executionRegionArabic: "asc" },
        select: { executionRegionArabic: true },
      }),
      prisma.tender.findMany({
        where: { tenderStatusNameArabic: { not: null } },
        distinct: ["tenderStatusNameArabic"],
        orderBy: { tenderStatusNameArabic: "asc" },
        select: { tenderStatusNameArabic: true },
      }),
    ]);

  const totalPages = Math.max(1, Math.ceil(resultCount / TENDERS_PER_PAGE));
  const hasFilters =
    search.q ||
    search.agency ||
    search.activity ||
    search.region ||
    search.status ||
    search.deadline !== "any" ||
    search.sort !== "published-desc";

  return (
    <main className="min-h-screen">
      <header className="border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
          <div>
            <p className="text-lg font-semibold tracking-tight">
              Etimad Intelligence
            </p>
            <p className="text-sm text-[var(--muted)]">
              {pick(locale, "Saudi public tender discovery", "اكتشاف المنافسات الحكومية السعودية")}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/tenders/recommended"
              className="text-sm font-semibold hover:text-[var(--accent)]"
            >
              {pick(locale, "Recommended", "الموصى بها")}
            </Link>
            <Link
              href="/company"
              className="text-sm font-semibold hover:text-[var(--accent)]"
            >
              {pick(locale, "Company profile", "ملف الشركة")}
            </Link>
            <Link
              href="/tenders/saved"
              className="text-sm font-semibold hover:text-[var(--accent)]"
            >
              {pick(locale, "Saved workspace", "مساحة العمل المحفوظة")}
            </Link>
            <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--accent)]">
              {pick(locale, "Live Etimad data", "بيانات اعتماد مباشرة")}
            </span>
            <LanguageSwitcher locale={locale} />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
        <section className="grid gap-8 border-b border-[var(--border)] pb-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
              {pick(locale, "Tender workspace", "مساحة المنافسات")}
            </p>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
              {pick(locale, "Find the opportunities that matter.", "اعثر على الفرص التي تهمك.")}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--muted)]">
              {pick(locale, "Search original Arabic tender content and narrow results using fields stored in your own database.", "ابحث في محتوى المنافسات العربي الأصلي وضيّق النتائج باستخدام البيانات المخزنة في قاعدة بياناتك.")}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {[
              [pick(locale, "Results", "النتائج"), resultCount],
              [pick(locale, "Agencies", "الجهات"), agencies.length],
              [pick(locale, "Activities", "الأنشطة"), activities.length],
            ].map(([label, value]) => (
              <div
                key={label}
                className="min-w-24 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-center sm:min-w-32"
              >
                <p className="text-2xl font-semibold tracking-tight">{value}</p>
                <p className="mt-0.5 text-xs text-[var(--muted)]">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <form
          action="/tenders"
          className="mt-8 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6"
        >
          <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_repeat(2,minmax(0,1fr))]">
            <label className="grid gap-1.5 text-sm font-medium">
              {pick(locale, "Keyword or reference number", "كلمة مفتاحية أو رقم مرجعي")}
              <input
                name="q"
                defaultValue={search.q}
                placeholder={pick(locale, "Search title, description, agency...", "ابحث في العنوان أو الوصف أو الجهة...")}
                className="rounded-xl border border-[var(--border)] bg-white px-3 py-2.5 font-normal outline-none focus:border-[var(--accent)]"
              />
            </label>
            <FilterSelect
              label={pick(locale, "Agency", "الجهة")}
              name="agency"
              defaultValue={search.agency}
              allLabel={pick(locale, "All agencies", "كل الجهات")}
              options={agencies.map((item) => item.agencyNameArabic)}
            />
            <FilterSelect
              label={pick(locale, "Activity", "النشاط")}
              name="activity"
              defaultValue={search.activity}
              allLabel={pick(locale, "All activities", "كل الأنشطة")}
              options={activities.flatMap((item) =>
                item.activityNameArabic ? [item.activityNameArabic] : [],
              )}
            />
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FilterSelect
              label={pick(locale, "Execution region", "منطقة التنفيذ")}
              name="region"
              defaultValue={search.region}
              allLabel={pick(locale, "All enriched regions", "كل المناطق المتاحة")}
              options={regions.flatMap((item) =>
                item.executionRegionArabic ? [item.executionRegionArabic] : [],
              )}
            />
            <FilterSelect
              label={pick(locale, "Status", "الحالة")}
              name="status"
              defaultValue={search.status}
              allLabel={pick(locale, "All statuses", "كل الحالات")}
              options={statuses.flatMap((item) =>
                item.tenderStatusNameArabic ? [item.tenderStatusNameArabic] : [],
              )}
            />
            <label className="grid gap-1.5 text-sm font-medium">
              {pick(locale, "Submission deadline", "آخر موعد للتقديم")}
              <select
                name="deadline"
                defaultValue={search.deadline}
                className="rounded-xl border border-[var(--border)] bg-white px-3 py-2.5 font-normal outline-none focus:border-[var(--accent)]"
              >
                <option value="any">{pick(locale, "Any deadline", "أي موعد")}</option>
                <option value="7">{pick(locale, "Closing within 7 days", "تغلق خلال 7 أيام")}</option>
                <option value="30">{pick(locale, "Closing within 30 days", "تغلق خلال 30 يوماً")}</option>
                <option value="missing">{pick(locale, "Deadline not provided", "الموعد غير متاح")}</option>
              </select>
            </label>
            <label className="grid gap-1.5 text-sm font-medium">
              {pick(locale, "Sort results", "ترتيب النتائج")}
              <select
                name="sort"
                defaultValue={search.sort}
                className="rounded-xl border border-[var(--border)] bg-white px-3 py-2.5 font-normal outline-none focus:border-[var(--accent)]"
              >
                <option value="published-desc">{pick(locale, "Newest published", "الأحدث نشراً")}</option>
                <option value="deadline-asc">{pick(locale, "Deadline: soonest first", "الموعد: الأقرب أولاً")}</option>
                <option value="deadline-desc">{pick(locale, "Deadline: latest first", "الموعد: الأبعد أولاً")}</option>
              </select>
            </label>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              className="rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
            >
              {pick(locale, "Apply search and filters", "تطبيق البحث والفلاتر")}
            </button>
            {hasFilters && (
              <Link
                href="/tenders"
                className="px-2 py-2.5 text-sm font-semibold text-[var(--muted)] hover:text-[var(--accent)]"
              >
                {pick(locale, "Clear all", "مسح الكل")}
              </Link>
            )}
          </div>
        </form>

        <section className="pt-8">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">
                {hasFilters
                  ? pick(locale, "Matching tenders", "المنافسات المطابقة")
                  : pick(locale, "Recently published", "الأحدث نشراً")}
              </h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {resultCount} {pick(locale, resultCount === 1 ? "result" : "results", "نتيجة")} ·{" "}
                {pick(locale, "Page", "صفحة")} {search.page} {pick(locale, "of", "من")} {totalPages}
              </p>
            </div>
          </div>

          {tenders.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[var(--border-strong)] bg-[var(--surface)] px-6 py-16 text-center">
              <h2 className="text-xl font-semibold">{pick(locale, "No matching tenders", "لا توجد منافسات مطابقة")}</h2>
              <p className="mt-2 text-[var(--muted)]">
                {pick(locale, "Try removing a filter or using a broader keyword.", "جرّب إزالة أحد الفلاتر أو استخدام كلمة أوسع.")}
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {tenders.map((tender) => (
                (() => {
                  const title = localizedTenderText(
                    locale,
                    tender.titleEnglish,
                    tender.titleArabic,
                  );
                  return (
                <article
                  key={tender.id}
                  className="group rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 transition hover:border-[var(--border-strong)] hover:shadow-[0_12px_35px_rgba(20,55,43,0.07)] sm:p-6"
                >
                  <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-start">
                    <div className="min-w-0">
                      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-medium">
                        <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-[var(--accent)]">
                          {tender.tenderTypeNameArabic}
                        </span>
                        {tender.activityNameArabic && (
                          <span className="rounded-full bg-[var(--background)] px-2.5 py-1 text-[var(--muted)]">
                            {tender.activityNameArabic}
                          </span>
                        )}
                        {tender.executionRegionArabic && (
                          <span className="rounded-full bg-[var(--background)] px-2.5 py-1 text-[var(--muted)]">
                            {tender.executionRegionArabic}
                          </span>
                        )}
                        {tender.tenderStatusNameArabic && (
                          <span className="rounded-full bg-[var(--background)] px-2.5 py-1 text-[var(--muted)]">
                            {tender.tenderStatusNameArabic}
                          </span>
                        )}
                        {tender.detailEnrichmentStatus === "complete" && (
                          <span className="rounded-full border border-[var(--border-strong)] px-2.5 py-1 text-[var(--accent)]">
                            {pick(locale, "Details enriched", "التفاصيل مُثراة")}
                          </span>
                        )}
                        <span className="text-[var(--muted)]">
                          {pick(locale, "Ref.", "المرجع")} {tender.referenceNumber}
                        </span>
                      </div>

                      <h3
                        dir={title.direction}
                        lang={title.language}
                        className={`text-xl font-semibold leading-8 tracking-tight ${
                          title.direction === "rtl" ? "text-right" : ""
                        }`}
                      >
                        {title.value}
                      </h3>
                      <div
                        dir="rtl"
                        lang="ar"
                        className="mt-3 text-right text-sm leading-6 text-[var(--muted)]"
                      >
                        <p>{tender.agencyNameArabic}</p>
                        {tender.branchNameArabic && (
                          <p>{tender.branchNameArabic}</p>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-[var(--border)] pt-4 text-sm lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
                      <dl className="grid grid-cols-2 gap-4 lg:grid-cols-1">
                        <div>
                          <dt className="text-xs text-[var(--muted)]">
                            {pick(locale, "Published", "تاريخ النشر")}
                          </dt>
                          <dd className="mt-1 font-medium">
                            {formatDate(tender.publishedAt, locale)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs text-[var(--muted)]">
                            {pick(locale, "Submission deadline", "آخر موعد للتقديم")}
                          </dt>
                          <dd className="mt-1 font-semibold">
                            {formatDate(tender.submissionDeadline, locale)}
                          </dd>
                        </div>
                      </dl>
                      <a
                        href={tender.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-5 inline-flex font-semibold text-[var(--accent)] hover:underline"
                      >
                        {pick(locale, "View original on Etimad", "عرض الأصل في اعتماد")} ↗
                      </a>
                      <Link
                        href={`/tenders/${tender.id}`}
                        className="mt-3 block font-semibold text-[var(--foreground)] hover:text-[var(--accent)]"
                      >
                        {pick(locale, "Open internal details", "فتح التفاصيل الداخلية")} <span className="rtl-flip inline-block">→</span>
                      </Link>
                      <div className="mt-4">
                        <DecisionControls
                          tenderId={tender.id}
                          status={tender.decision?.status ?? null}
                          compact
                          locale={locale}
                        />
                      </div>
                    </div>
                  </div>
                </article>
                  );
                })()
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <nav
              aria-label="Tender result pages"
              className="mt-8 flex items-center justify-between gap-4"
            >
              {search.page > 1 ? (
                <Link
                  href={buildPageHref(search, search.page - 1)}
                  className="rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm font-semibold hover:border-[var(--accent)]"
                >
                  <span className="rtl-flip inline-block">←</span> {pick(locale, "Previous", "السابق")}
                </Link>
              ) : (
                <span />
              )}
              <span className="text-sm text-[var(--muted)]">
                {pick(locale, "Page", "صفحة")} {search.page} {pick(locale, "of", "من")} {totalPages}
              </span>
              {search.page < totalPages ? (
                <Link
                  href={buildPageHref(search, search.page + 1)}
                  className="rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm font-semibold hover:border-[var(--accent)]"
                >
                  {pick(locale, "Next", "التالي")} <span className="rtl-flip inline-block">→</span>
                </Link>
              ) : (
                <span />
              )}
            </nav>
          )}
        </section>
      </div>
    </main>
  );
}
