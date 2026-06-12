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

export const dynamic = "force-dynamic";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Riyadh",
});

function formatDate(date: Date | null): string {
  return date ? dateFormatter.format(date) : "Not provided";
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
              Saudi public tender discovery
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/company"
              className="text-sm font-semibold hover:text-[var(--accent)]"
            >
              Company profile
            </Link>
            <Link
              href="/tenders/saved"
              className="text-sm font-semibold hover:text-[var(--accent)]"
            >
              Saved workspace
            </Link>
            <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--accent)]">
              Live Etimad data
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
        <section className="grid gap-8 border-b border-[var(--border)] pb-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
              Tender workspace
            </p>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
              Find the opportunities that matter.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--muted)]">
              Search original Arabic tender content and narrow results using
              fields stored in your own database.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {[
              ["Results", resultCount],
              ["Agencies", agencies.length],
              ["Activities", activities.length],
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
              Keyword or reference number
              <input
                name="q"
                defaultValue={search.q}
                placeholder="Search title, description, agency..."
                className="rounded-xl border border-[var(--border)] bg-white px-3 py-2.5 font-normal outline-none focus:border-[var(--accent)]"
              />
            </label>
            <FilterSelect
              label="Agency"
              name="agency"
              defaultValue={search.agency}
              allLabel="All agencies"
              options={agencies.map((item) => item.agencyNameArabic)}
            />
            <FilterSelect
              label="Activity"
              name="activity"
              defaultValue={search.activity}
              allLabel="All activities"
              options={activities.flatMap((item) =>
                item.activityNameArabic ? [item.activityNameArabic] : [],
              )}
            />
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FilterSelect
              label="Execution region"
              name="region"
              defaultValue={search.region}
              allLabel="All enriched regions"
              options={regions.flatMap((item) =>
                item.executionRegionArabic ? [item.executionRegionArabic] : [],
              )}
            />
            <FilterSelect
              label="Status"
              name="status"
              defaultValue={search.status}
              allLabel="All statuses"
              options={statuses.flatMap((item) =>
                item.tenderStatusNameArabic ? [item.tenderStatusNameArabic] : [],
              )}
            />
            <label className="grid gap-1.5 text-sm font-medium">
              Submission deadline
              <select
                name="deadline"
                defaultValue={search.deadline}
                className="rounded-xl border border-[var(--border)] bg-white px-3 py-2.5 font-normal outline-none focus:border-[var(--accent)]"
              >
                <option value="any">Any deadline</option>
                <option value="7">Closing within 7 days</option>
                <option value="30">Closing within 30 days</option>
                <option value="missing">Deadline not provided</option>
              </select>
            </label>
            <label className="grid gap-1.5 text-sm font-medium">
              Sort results
              <select
                name="sort"
                defaultValue={search.sort}
                className="rounded-xl border border-[var(--border)] bg-white px-3 py-2.5 font-normal outline-none focus:border-[var(--accent)]"
              >
                <option value="published-desc">Newest published</option>
                <option value="deadline-asc">Deadline: soonest first</option>
                <option value="deadline-desc">Deadline: latest first</option>
              </select>
            </label>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              className="rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
            >
              Apply search and filters
            </button>
            {hasFilters && (
              <Link
                href="/tenders"
                className="px-2 py-2.5 text-sm font-semibold text-[var(--muted)] hover:text-[var(--accent)]"
              >
                Clear all
              </Link>
            )}
          </div>
        </form>

        <section className="pt-8">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">
                {hasFilters ? "Matching tenders" : "Recently published"}
              </h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {resultCount} {resultCount === 1 ? "result" : "results"} · Page{" "}
                {search.page} of {totalPages}
              </p>
            </div>
          </div>

          {tenders.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[var(--border-strong)] bg-[var(--surface)] px-6 py-16 text-center">
              <h2 className="text-xl font-semibold">No matching tenders</h2>
              <p className="mt-2 text-[var(--muted)]">
                Try removing a filter or using a broader keyword.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {tenders.map((tender) => (
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
                            Details enriched
                          </span>
                        )}
                        <span className="text-[var(--muted)]">
                          Ref. {tender.referenceNumber}
                        </span>
                      </div>

                      <h3
                        dir="rtl"
                        lang="ar"
                        className="text-right text-xl font-semibold leading-8 tracking-tight"
                      >
                        {tender.titleArabic}
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
                            Published
                          </dt>
                          <dd className="mt-1 font-medium">
                            {formatDate(tender.publishedAt)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs text-[var(--muted)]">
                            Submission deadline
                          </dt>
                          <dd className="mt-1 font-semibold">
                            {formatDate(tender.submissionDeadline)}
                          </dd>
                        </div>
                      </dl>
                      <a
                        href={tender.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-5 inline-flex font-semibold text-[var(--accent)] hover:underline"
                      >
                        View original on Etimad ↗
                      </a>
                      <Link
                        href={`/tenders/${tender.id}`}
                        className="mt-3 block font-semibold text-[var(--foreground)] hover:text-[var(--accent)]"
                      >
                        Open internal details →
                      </Link>
                      <div className="mt-4">
                        <DecisionControls
                          tenderId={tender.id}
                          status={tender.decision?.status ?? null}
                          compact
                        />
                      </div>
                    </div>
                  </div>
                </article>
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
                  ← Previous
                </Link>
              ) : (
                <span />
              )}
              <span className="text-sm text-[var(--muted)]">
                Page {search.page} of {totalPages}
              </span>
              {search.page < totalPages ? (
                <Link
                  href={buildPageHref(search, search.page + 1)}
                  className="rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm font-semibold hover:border-[var(--accent)]"
                >
                  Next →
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
