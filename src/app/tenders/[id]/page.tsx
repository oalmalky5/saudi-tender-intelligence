import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { updateTenderNote } from "../actions";
import { DecisionControls } from "../decision-controls";

export const dynamic = "force-dynamic";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Riyadh",
});

function formatDate(date: Date | null): string {
  return date ? dateFormatter.format(date) : "Not publicly provided";
}

function formatBoolean(value: boolean | null): string {
  if (value === null) {
    return "Not publicly provided";
  }

  return value ? "Required" : "Not required";
}

function DetailItem({
  label,
  value,
  arabic = false,
}: {
  label: string;
  value: string | number | null;
  arabic?: boolean;
}) {
  return (
    <div className="border-b border-[var(--border)] py-4 last:border-b-0">
      <dt className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--muted)]">
        {label}
      </dt>
      <dd
        dir={arabic ? "rtl" : undefined}
        lang={arabic ? "ar" : undefined}
        className={`mt-1.5 leading-7 ${arabic ? "text-right" : ""}`}
      >
        {value ?? "Not publicly provided"}
      </dd>
    </div>
  );
}

export default async function TenderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tender = await prisma.tender.findUnique({
    where: { id },
    include: {
      attachments: { orderBy: { nameArabic: "asc" } },
      decision: true,
    },
  });

  if (!tender) {
    notFound();
  }

  const isEnriched = tender.detailEnrichmentStatus === "complete";

  return (
    <main className="min-h-screen">
      <header className="border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
          <Link href="/tenders" className="font-semibold hover:text-[var(--accent)]">
            ← All tenders
          </Link>
          <div className="flex items-center gap-4 text-sm font-semibold">
            <Link href="/company" className="hover:text-[var(--accent)]">
              Company profile
            </Link>
            <a
              href={tender.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[var(--accent)] hover:underline"
            >
              View original on Etimad ↗
            </a>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-9">
          <div className="flex flex-wrap gap-2 text-xs font-medium">
            <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1.5 text-[var(--accent)]">
              {tender.tenderTypeNameArabic}
            </span>
            <span className="rounded-full bg-[var(--background)] px-3 py-1.5 text-[var(--muted)]">
              Ref. {tender.referenceNumber}
            </span>
          </div>
          <h1
            dir="rtl"
            lang="ar"
            className="mt-6 text-right text-3xl font-semibold leading-[1.45] tracking-tight sm:text-4xl"
          >
            {tender.titleArabic}
          </h1>
          <p
            dir="rtl"
            lang="ar"
            className="mt-4 text-right leading-7 text-[var(--muted)]"
          >
            {tender.agencyNameArabic}
          </p>
          <div className="mt-6">
            <DecisionControls
              tenderId={tender.id}
              status={tender.decision?.status ?? null}
            />
          </div>
        </section>

        {!isEnriched && (
          <section className="mt-6 rounded-2xl border border-[var(--border-strong)] bg-[var(--accent-soft)] p-5">
            <p className="font-semibold">Public details have not been enriched yet.</p>
            <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
              Run{" "}
              <code className="rounded bg-white px-2 py-1 text-[var(--accent)]">
                npm run etimad:enrich -- {tender.referenceNumber}
              </code>{" "}
              to fetch and store this tender&apos;s public Etimad details.
            </p>
          </section>
        )}

        {tender.detailEnrichmentError && (
          <section className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-800">
            <p className="font-semibold">Latest enrichment attempt failed</p>
            <p className="mt-1 text-sm">{tender.detailEnrichmentError}</p>
          </section>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6">
            <h2 className="text-xl font-semibold">Opportunity summary</h2>
            <dl className="mt-3">
              <DetailItem
                label="Purpose / description"
                value={tender.descriptionArabic}
                arabic
              />
              <DetailItem label="Status" value={tender.tenderStatusNameArabic} arabic />
              <DetailItem label="Activity" value={tender.activityNameArabic} arabic />
              <DetailItem
                label="Classification"
                value={tender.classificationFieldArabic}
                arabic
              />
              <DetailItem
                label="Submission method"
                value={tender.submissionMethodArabic}
                arabic
              />
              <DetailItem
                label="Contract duration"
                value={tender.contractDurationArabic}
                arabic
              />
            </dl>
          </section>

          <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6">
            <h2 className="text-xl font-semibold">Important dates</h2>
            <dl className="mt-3">
              <DetailItem label="Published" value={formatDate(tender.publishedAt)} />
              <DetailItem
                label="Enquiries deadline"
                value={formatDate(tender.enquiriesDeadline)}
              />
              <DetailItem
                label="Submission deadline"
                value={formatDate(tender.submissionDeadline)}
              />
              <DetailItem
                label="Offers opening"
                value={formatDate(tender.offersOpeningAt)}
              />
              <DetailItem
                label="Expected award"
                value={formatDate(tender.expectedAwardAt)}
              />
              <DetailItem
                label="Expected work start"
                value={formatDate(tender.workStartsAt)}
              />
            </dl>
          </section>

          <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6">
            <h2 className="text-xl font-semibold">Execution location</h2>
            <dl className="mt-3">
              <DetailItem label="Region" value={tender.executionRegionArabic} arabic />
              <DetailItem label="City" value={tender.executionCityArabic} arabic />
              <DetailItem
                label="Details"
                value={tender.executionDetailsArabic}
                arabic
              />
            </dl>
          </section>

          <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6">
            <h2 className="text-xl font-semibold">Requirements</h2>
            <dl className="mt-3">
              <DetailItem
                label="Document price"
                value={
                  tender.documentPrice
                    ? `${tender.documentPrice.toString()} SAR`
                    : null
                }
              />
              <DetailItem
                label="Initial guarantee"
                value={formatBoolean(tender.initialGuaranteeRequired)}
              />
              <DetailItem
                label="Final guarantee"
                value={
                  tender.finalGuaranteePercentage
                    ? `${tender.finalGuaranteePercentage.toString()}%`
                    : null
                }
              />
              <DetailItem
                label="Insurance"
                value={formatBoolean(tender.insuranceRequired)}
              />
              <DetailItem
                label="Local-content requirements"
                value={tender.localContentRequirementsArabic}
                arabic
              />
            </dl>
          </section>
        </div>

        <section className="mt-6 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <h2 className="text-xl font-semibold">Public attachments</h2>
          {tender.attachments.length === 0 ? (
            <p className="mt-3 text-sm text-[var(--muted)]">
              No public attachments were provided.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-[var(--border)]">
              {tender.attachments.map((attachment) => (
                <li key={attachment.id} className="py-3">
                  <a
                    href={attachment.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    dir="rtl"
                    lang="ar"
                    className="block text-right font-semibold text-[var(--accent)] hover:underline"
                  >
                    {attachment.nameArabic} ↗
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-6 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <h2 className="text-xl font-semibold">Your note</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Record questions, concerns, or next actions for this tender.
          </p>
          <form action={updateTenderNote} className="mt-4">
            <input type="hidden" name="tenderId" value={tender.id} />
            <textarea
              name="note"
              defaultValue={tender.decision?.note ?? ""}
              rows={5}
              placeholder="Example: Ask the technical team to review the scope before Friday."
              className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 leading-7 outline-none focus:border-[var(--accent)]"
            />
            <button
              type="submit"
              className="mt-3 rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
            >
              Save note
            </button>
          </form>
        </section>

        <p className="mt-6 text-sm text-[var(--muted)]">
          Detail enrichment status: {tender.detailEnrichmentStatus}
          {tender.detailsEnrichedAt
            ? ` · Last enriched ${formatDate(tender.detailsEnrichedAt)}`
            : ""}
        </p>
      </div>
    </main>
  );
}
