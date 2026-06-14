import Link from "next/link";

import { LanguageSwitcher } from "@/app/language-switcher";
import type { CsvImportRow } from "@/lib/csv/parse-tender-csv";
import type { CsvTenderField } from "@/lib/csv/tender-csv-schema";
import { dateLocale, pick } from "@/lib/i18n/locale";
import { getLocale } from "@/lib/i18n/locale-server";
import { prisma } from "@/lib/prisma";

import { confirmCsvImport, previewCsvImport } from "./actions";

export const dynamic = "force-dynamic";

type PageParams = {
  session?: string | string[];
  error?: string | string[];
  imported?: string | string[];
};

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

const templateHeader =
  "referenceNumber,tenderNumber,titleArabic,titleEnglish,descriptionArabic,descriptionEnglish,agencyNameArabic,branchNameArabic,tenderTypeNameArabic,tenderStatusNameArabic,activityNameArabic,executionRegionArabic,executionCityArabic,publishedAt,submissionDeadline,sourceUrl";

export default async function CsvImportPage({
  searchParams,
}: {
  searchParams: Promise<PageParams>;
}) {
  const params = await searchParams;
  const locale = await getLocale();
  const sessionId = first(params.session);
  const error = first(params.error);
  const imported = first(params.imported) === "1";
  const [session, recentSessions] = await Promise.all([
    sessionId
      ? prisma.csvImportSession.findUnique({ where: { id: sessionId } })
      : null,
    prisma.csvImportSession.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);
  const rows = session && Array.isArray(session.rows)
    ? (session.rows as unknown as CsvImportRow[])
    : [];
  const mapping =
    session && typeof session.headerMapping === "object" && session.headerMapping
      ? (session.headerMapping as Partial<Record<CsvTenderField, string>>)
      : {};
  const dateFormatter = new Intl.DateTimeFormat(dateLocale(locale), {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Riyadh",
  });

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
            {pick(locale, "Local admin tool", "أداة إدارة محلية")}
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
            {pick(locale, "Import tenders from CSV.", "استيراد المنافسات من CSV.")}
          </h1>
          <p className="mt-4 max-w-3xl leading-7 text-[var(--muted)]">
            {pick(
              locale,
              "Upload a CSV to automatically map known headers, validate every row, detect duplicates, and preview changes before writing valid records.",
              "ارفع ملف CSV لتعيين الحقول المعروفة تلقائياً، والتحقق من كل صف، واكتشاف التكرارات، ومعاينة التغييرات قبل كتابة السجلات الصالحة.",
            )}
          </p>
        </section>

        {error && (
          <p className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </p>
        )}
        {imported && session && (
          <p className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-800">
            Import complete: {session.createdCount ?? 0} created and{" "}
            {session.updatedCount ?? 0} updated.
          </p>
        )}

        <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <form
            action={previewCsvImport}
            className="rounded-3xl border border-[var(--border)] bg-white p-6 sm:p-8"
          >
            <h2 className="text-xl font-semibold">{pick(locale, "Upload and preview", "رفع ومعاينة")}</h2>
            <input
              type="file"
              name="csv"
              accept=".csv,text/csv"
              required
              className="mt-5 block w-full rounded-xl border border-[var(--border)] bg-white p-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--accent-soft)] file:px-3 file:py-2 file:font-semibold file:text-[var(--accent)]"
            />
            <button
              type="submit"
              className="mt-4 rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white"
            >
              {pick(locale, "Preview CSV", "معاينة CSV")}
            </button>
            <p className="mt-3 text-xs leading-5 text-[var(--muted)]">
              Maximum 5 MB and 2,000 rows. Uploading only creates a staged
              preview; it does not modify tenders.
            </p>
          </form>

          <aside className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6">
            <h2 className="font-semibold">{pick(locale, "Required template fields", "حقول القالب المطلوبة")}</h2>
            <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
              referenceNumber, titleArabic, agencyNameArabic,
              tenderTypeNameArabic, publishedAt
            </p>
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-semibold">
                {pick(locale, "View complete header template", "عرض قالب العناوين الكامل")}
              </summary>
              <code className="mt-3 block overflow-x-auto rounded-xl bg-white p-3 text-xs leading-5">
                {templateHeader}
              </code>
            </details>
          </aside>
        </section>

        {session && (
          <section className="mt-8 rounded-3xl border border-[var(--border)] bg-white p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">{session.originalName}</h2>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {session.totalRows} rows · {session.validRows} valid ·{" "}
                  {session.invalidRows} invalid · {session.duplicateRows} duplicate
                </p>
              </div>
              {session.status === "preview" && session.validRows > 0 && (
                <form action={confirmCsvImport}>
                  <input type="hidden" name="sessionId" value={session.id} />
                  <button
                    type="submit"
                    className="rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white"
                  >
                    Import {session.validRows} valid rows
                  </button>
                </form>
              )}
            </div>

            <details className="mt-6 border-t border-[var(--border)] pt-5">
              <summary className="cursor-pointer text-sm font-semibold">
                Automatic header mapping
              </summary>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(mapping).map(([field, header]) => (
                  <p key={field} className="rounded-xl bg-[var(--background)] p-3 text-xs">
                    <strong>{field}</strong> ← {header}
                  </p>
                ))}
              </div>
            </details>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b border-[var(--border)] text-xs uppercase text-[var(--muted)]">
                  <tr>
                    <th className="py-3 pr-4">Row</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3 pr-4">Reference</th>
                    <th className="py-3 pr-4">Title</th>
                    <th className="py-3">Errors</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {rows.slice(0, 100).map((row) => (
                    <tr key={row.rowNumber}>
                      <td className="py-3 pr-4">{row.rowNumber}</td>
                      <td className="py-3 pr-4 font-semibold">{row.status}</td>
                      <td className="py-3 pr-4">{row.tender?.referenceNumber ?? "—"}</td>
                      <td dir="rtl" lang="ar" className="py-3 pr-4 text-right">
                        {row.tender?.titleArabic ?? "—"}
                      </td>
                      <td className="py-3 text-xs text-red-700">{row.errors.join(" ") || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <section className="mt-8 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <h2 className="font-semibold">{pick(locale, "Recent imports", "عمليات الاستيراد الأخيرة")}</h2>
          <ul className="mt-3 divide-y divide-[var(--border)] text-sm">
            {recentSessions.map((recent) => (
              <li key={recent.id} className="flex flex-wrap justify-between gap-3 py-3">
                <Link href={`/admin/import?session=${recent.id}`} className="font-semibold text-[var(--accent)] hover:underline">
                  {recent.originalName}
                </Link>
                <span className="text-[var(--muted)]">
                  {recent.status} · {recent.validRows}/{recent.totalRows} valid ·{" "}
                  {dateFormatter.format(recent.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
