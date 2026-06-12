import { prisma } from "@/lib/prisma";

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

export default async function TendersPage() {
  const tenders = await prisma.tender.findMany({
    orderBy: [{ publishedAt: "desc" }, { referenceNumber: "asc" }],
    take: 120,
    select: {
      id: true,
      referenceNumber: true,
      titleArabic: true,
      agencyNameArabic: true,
      branchNameArabic: true,
      activityNameArabic: true,
      tenderTypeNameArabic: true,
      publishedAt: true,
      submissionDeadline: true,
      sourceUrl: true,
    },
  });

  const agencyCount = new Set(
    tenders.map((tender) => tender.agencyNameArabic),
  ).size;
  const activityCount = new Set(
    tenders
      .map((tender) => tender.activityNameArabic)
      .filter((activity) => activity !== null),
  ).size;

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
          <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--accent)]">
            Live Etimad data
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
        <section className="grid gap-8 border-b border-[var(--border)] pb-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
              Tender workspace
            </p>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
              Active opportunities, gathered in one place.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--muted)]">
              Browse real public tenders imported from Etimad. Search,
              matching, and English summaries arrive in later milestones.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {[
              ["Tenders", tenders.length],
              ["Agencies", agencyCount],
              ["Activities", activityCount],
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

        <section className="pt-8">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">
                Recently published
              </h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Showing up to 120 tenders stored in your local database.
              </p>
            </div>
          </div>

          {tenders.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[var(--border-strong)] bg-[var(--surface)] px-6 py-16 text-center">
              <h2 className="text-xl font-semibold">No tenders imported yet</h2>
              <p className="mt-2 text-[var(--muted)]">
                Start the database, then run{" "}
                <code className="rounded bg-[var(--accent-soft)] px-2 py-1 text-sm text-[var(--accent)]">
                  npm run etimad:import
                </code>
                .
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
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
