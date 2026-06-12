import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { updateTenderNote } from "../actions";
import { DecisionControls } from "../decision-controls";
import { TenderSummaryPanel } from "./summary-panel";
import { LanguageSwitcher } from "@/app/language-switcher";
import { dateLocale, pick, type Locale } from "@/lib/i18n/locale";
import { getLocale } from "@/lib/i18n/locale-server";
import { localizedTenderText } from "@/lib/i18n/tender-text";

export const dynamic = "force-dynamic";

function formatDate(date: Date | null, locale: Locale): string {
  return date
    ? new Intl.DateTimeFormat(dateLocale(locale), {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZone: "Asia/Riyadh",
      }).format(date)
    : pick(locale, "Not publicly provided", "غير متاح للعامة");
}

function formatBoolean(value: boolean | null, locale: Locale): string {
  if (value === null) {
    return pick(locale, "Not publicly provided", "غير متاح للعامة");
  }

  return value
    ? pick(locale, "Required", "مطلوب")
    : pick(locale, "Not required", "غير مطلوب");
}

function DetailItem({
  label,
  value,
  arabic = false,
  locale,
}: {
  label: string;
  value: string | number | null;
  arabic?: boolean;
  locale: Locale;
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
        {value ?? pick(locale, "Not publicly provided", "غير متاح للعامة")}
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
  const locale = await getLocale();
  const [tender, companyProfile] = await Promise.all([
    prisma.tender.findUnique({
      where: { id },
      include: {
        attachments: { orderBy: { nameArabic: "asc" } },
        decision: true,
        aiSummaries: { orderBy: { generatedAt: "desc" }, take: 20 },
      },
    }),
    prisma.companyProfile.findUnique({
      where: { id: "primary" },
      select: { id: true, updatedAt: true },
    }),
  ]);

  if (!tender) {
    notFound();
  }

  const isEnriched = tender.detailEnrichmentStatus === "complete";
  const title = localizedTenderText(locale, tender.titleEnglish, tender.titleArabic);
  const description = localizedTenderText(
    locale,
    tender.descriptionEnglish,
    tender.descriptionArabic,
  );

  return (
    <main className="min-h-screen">
      <header className="border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
          <Link href="/tenders" className="font-semibold hover:text-[var(--accent)]">
            <span className="rtl-flip inline-block">←</span>{" "}
            {pick(locale, "All tenders", "كل المنافسات")}
          </Link>
          <div className="flex items-center gap-4 text-sm font-semibold">
            <Link href="/company" className="hover:text-[var(--accent)]">
              {pick(locale, "Company profile", "ملف الشركة")}
            </Link>
            <a
              href={tender.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[var(--accent)] hover:underline"
            >
              {pick(locale, "View original on Etimad", "عرض الأصل في اعتماد")} ↗
            </a>
            <LanguageSwitcher locale={locale} />
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
              {pick(locale, "Ref.", "المرجع")} {tender.referenceNumber}
            </span>
          </div>
          <h1
            dir={title.direction}
            lang={title.language}
            className={`mt-6 text-3xl font-semibold leading-[1.45] tracking-tight sm:text-4xl ${
              title.direction === "rtl" ? "text-right" : ""
            }`}
          >
            {title.value}
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
              locale={locale}
            />
          </div>
        </section>

        {!isEnriched && (
          <section className="mt-6 rounded-2xl border border-[var(--border-strong)] bg-[var(--accent-soft)] p-5">
            <p className="font-semibold">
              {pick(locale, "Public details have not been enriched yet.", "لم يتم إثراء التفاصيل العامة بعد.")}
            </p>
            <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
              Run{" "}
              <code className="rounded bg-white px-2 py-1 text-[var(--accent)]">
                npm run etimad:enrich -- {tender.referenceNumber}
              </code>{" "}
              {pick(locale, "to fetch and store this tender's public Etimad details.", "لجلب تفاصيل المنافسة العامة من اعتماد وتخزينها.")}
            </p>
          </section>
        )}

        {tender.detailEnrichmentError && (
          <section className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-800">
            <p className="font-semibold">
              {pick(locale, "Latest enrichment attempt failed", "فشلت آخر محاولة إثراء")}
            </p>
            <p className="mt-1 text-sm">{tender.detailEnrichmentError}</p>
          </section>
        )}

        <TenderSummaryPanel
          tenderId={tender.id}
          tenderUpdatedAt={tender.updatedAt}
          currentCompanyProfile={companyProfile}
          summaries={tender.aiSummaries}
          locale={locale}
        />

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6">
            <h2 className="text-xl font-semibold">{pick(locale, "Opportunity summary", "ملخص الفرصة")}</h2>
            <dl className="mt-3">
              <DetailItem
                label={pick(locale, "Purpose / description", "الغرض / الوصف")}
                value={description.value}
                arabic={description.direction === "rtl"}
                locale={locale}
              />
              <DetailItem locale={locale} label={pick(locale, "Status", "الحالة")} value={tender.tenderStatusNameArabic} arabic />
              <DetailItem locale={locale} label={pick(locale, "Activity", "النشاط")} value={tender.activityNameArabic} arabic />
              <DetailItem
                locale={locale}
                label={pick(locale, "Classification", "التصنيف")}
                value={tender.classificationFieldArabic}
                arabic
              />
              <DetailItem
                locale={locale}
                label={pick(locale, "Submission method", "طريقة التقديم")}
                value={tender.submissionMethodArabic}
                arabic
              />
              <DetailItem
                locale={locale}
                label={pick(locale, "Contract duration", "مدة العقد")}
                value={tender.contractDurationArabic}
                arabic
              />
            </dl>
          </section>

          <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6">
            <h2 className="text-xl font-semibold">{pick(locale, "Important dates", "المواعيد المهمة")}</h2>
            <dl className="mt-3">
              <DetailItem locale={locale} label={pick(locale, "Published", "تاريخ النشر")} value={formatDate(tender.publishedAt, locale)} />
              <DetailItem
                locale={locale}
                label={pick(locale, "Enquiries deadline", "آخر موعد للاستفسارات")}
                value={formatDate(tender.enquiriesDeadline, locale)}
              />
              <DetailItem
                locale={locale}
                label={pick(locale, "Submission deadline", "آخر موعد للتقديم")}
                value={formatDate(tender.submissionDeadline, locale)}
              />
              <DetailItem
                locale={locale}
                label={pick(locale, "Offers opening", "فتح العروض")}
                value={formatDate(tender.offersOpeningAt, locale)}
              />
              <DetailItem
                locale={locale}
                label={pick(locale, "Expected award", "الترسية المتوقعة")}
                value={formatDate(tender.expectedAwardAt, locale)}
              />
              <DetailItem
                locale={locale}
                label={pick(locale, "Expected work start", "بدء العمل المتوقع")}
                value={formatDate(tender.workStartsAt, locale)}
              />
            </dl>
          </section>

          <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6">
            <h2 className="text-xl font-semibold">{pick(locale, "Execution location", "موقع التنفيذ")}</h2>
            <dl className="mt-3">
              <DetailItem locale={locale} label={pick(locale, "Region", "المنطقة")} value={tender.executionRegionArabic} arabic />
              <DetailItem locale={locale} label={pick(locale, "City", "المدينة")} value={tender.executionCityArabic} arabic />
              <DetailItem
                locale={locale}
                label={pick(locale, "Details", "التفاصيل")}
                value={tender.executionDetailsArabic}
                arabic
              />
            </dl>
          </section>

          <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6">
            <h2 className="text-xl font-semibold">{pick(locale, "Requirements", "المتطلبات")}</h2>
            <dl className="mt-3">
              <DetailItem
                locale={locale}
                label={pick(locale, "Document price", "سعر الكراسة")}
                value={
                  tender.documentPrice
                    ? `${tender.documentPrice.toString()} SAR`
                    : null
                }
              />
              <DetailItem
                locale={locale}
                label={pick(locale, "Initial guarantee", "الضمان الابتدائي")}
                value={formatBoolean(tender.initialGuaranteeRequired, locale)}
              />
              <DetailItem
                locale={locale}
                label={pick(locale, "Final guarantee", "الضمان النهائي")}
                value={
                  tender.finalGuaranteePercentage
                    ? `${tender.finalGuaranteePercentage.toString()}%`
                    : null
                }
              />
              <DetailItem
                locale={locale}
                label={pick(locale, "Insurance", "التأمين")}
                value={formatBoolean(tender.insuranceRequired, locale)}
              />
              <DetailItem
                locale={locale}
                label={pick(locale, "Local-content requirements", "متطلبات المحتوى المحلي")}
                value={tender.localContentRequirementsArabic}
                arabic
              />
            </dl>
          </section>
        </div>

        <section className="mt-6 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <h2 className="text-xl font-semibold">{pick(locale, "Public attachments", "المرفقات العامة")}</h2>
          {tender.attachments.length === 0 ? (
            <p className="mt-3 text-sm text-[var(--muted)]">
              {pick(locale, "No public attachments were provided.", "لم يتم توفير مرفقات عامة.")}
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
          <h2 className="text-xl font-semibold">{pick(locale, "Your note", "ملاحظتك")}</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {pick(locale, "Record questions, concerns, or next actions for this tender.", "سجل الأسئلة أو المخاوف أو الخطوات التالية لهذه المنافسة.")}
          </p>
          <form action={updateTenderNote} className="mt-4">
            <input type="hidden" name="tenderId" value={tender.id} />
            <textarea
              name="note"
              defaultValue={tender.decision?.note ?? ""}
              rows={5}
              placeholder={pick(locale, "Example: Ask the technical team to review the scope before Friday.", "مثال: اطلب من الفريق الفني مراجعة النطاق قبل يوم الجمعة.")}
              className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 leading-7 outline-none focus:border-[var(--accent)]"
            />
            <button
              type="submit"
              className="mt-3 rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
            >
              {pick(locale, "Save note", "حفظ الملاحظة")}
            </button>
          </form>
        </section>

        <p className="mt-6 text-sm text-[var(--muted)]">
          {pick(locale, "Detail enrichment status", "حالة إثراء التفاصيل")}: {tender.detailEnrichmentStatus}
          {tender.detailsEnrichedAt
            ? ` · ${pick(locale, "Last enriched", "آخر إثراء")} ${formatDate(tender.detailsEnrichedAt, locale)}`
            : ""}
        </p>
      </div>
    </main>
  );
}
