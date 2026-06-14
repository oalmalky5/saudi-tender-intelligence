import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import Link from "next/link";
import { notFound } from "next/navigation";
import { updateTenderNote } from "../actions";
import { DecisionControls } from "../decision-controls";
import { TenderSummaryPanel } from "./summary-panel";
import { LanguageSwitcher } from "@/app/language-switcher";
import { dateLocale, pick, type Locale } from "@/lib/i18n/locale";
import { getLocale } from "@/lib/i18n/locale-server";
import { localizedTenderText } from "@/lib/i18n/tender-text";
import {
  buildTenderTranslationSource,
  hashTenderTranslationSource,
} from "@/lib/ai/tender-translation-source";
import { TenderTranslationPanel } from "./translation-panel";
import {
  loadMetadataTranslations,
  localizedMetadata,
} from "@/lib/translation/tender-metadata";
import { TenderBookletPanel } from "./booklet-panel";

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
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ noteSaved?: string | string[] }>;
}) {
  const { id } = await params;
  const noteSavedValue = (await searchParams).noteSaved;
  const noteSaved = Array.isArray(noteSavedValue)
    ? noteSavedValue[0] === "1"
    : noteSavedValue === "1";
  const session = await getSession();
  const workspaceId = session?.workspaceId ?? "";
  const locale = await getLocale();
  const [tender, companyProfile, metadataTranslations] = await Promise.all([
    prisma.tender.findUnique({
      where: { id },
      include: {
        attachments: { orderBy: { nameArabic: "asc" } },
        decisions: { where: { workspaceId }, take: 1 },
        aiSummaries: {
          where: { workspaceId },
          orderBy: { generatedAt: "desc" },
          take: 20,
        },
        translations: { orderBy: { generatedAt: "desc" }, take: 20 },
        booklets: {
          where: { workspaceId },
          orderBy: { createdAt: "desc" },
          include: {
            pages: { orderBy: { pageNumber: "asc" } },
            analyses: { orderBy: { generatedAt: "desc" }, take: 5 },
          },
        },
      },
    }),
    prisma.companyProfile.findUnique({
      where: { workspaceId },
      select: { id: true, updatedAt: true },
    }),
    loadMetadataTranslations(prisma),
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
  const translationSourceHash = hashTenderTranslationSource(
    buildTenderTranslationSource(tender),
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
        {noteSaved && (
          <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-800">
            {pick(
              locale,
              "Note saved. You can review all notes from Saved → Notes.",
              "تم حفظ الملاحظة. يمكنك مراجعة جميع الملاحظات من المحفوظات ← الملاحظات.",
            )}
          </div>
        )}
        <nav className="sticky top-3 z-20 mb-6 flex flex-wrap gap-2 rounded-2xl border border-[var(--border)] bg-white/90 p-2 shadow-[0_10px_30px_rgba(20,55,43,0.08)] backdrop-blur">
          {[
            ["overview", pick(locale, "Overview", "نظرة عامة")],
            ["ai-summary", pick(locale, "AI summary", "ملخص الذكاء")],
            ["translation", pick(locale, "Translation", "الترجمة")],
            ["booklet", pick(locale, "Booklet analysis", "تحليل الكراسة")],
            ["source-details", pick(locale, "Source details", "تفاصيل المصدر")],
            ["notes", pick(locale, "Notes", "الملاحظات")],
          ].map(([href, label]) => (
            <a key={href} href={`#${href}`} className="rounded-xl px-3 py-2 text-xs font-semibold text-[var(--muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]">
              {label}
            </a>
          ))}
        </nav>
        <section id="overview" className="scroll-mt-24 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-9">
          <div className="flex flex-wrap gap-2 text-xs font-medium">
            <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1.5 text-[var(--accent)]">
              {localizedMetadata(metadataTranslations, "type", tender.tenderTypeNameArabic, locale)}
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
          <p className="mt-4 leading-7 text-[var(--muted)]">
            {localizedMetadata(metadataTranslations, "agency", tender.agencyNameArabic, locale)}
          </p>
          {session && (
            <div className="mt-6">
              <DecisionControls
                tenderId={tender.id}
                status={tender.decisions[0]?.status ?? null}
                locale={locale}
              />
            </div>
          )}
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

        <div id="ai-summary" className="scroll-mt-24">
        {session && (
          <TenderSummaryPanel
            tenderId={tender.id}
            tenderUpdatedAt={tender.updatedAt}
            currentCompanyProfile={companyProfile}
            summaries={tender.aiSummaries}
            locale={locale}
          />
        )}
        </div>

        <div id="translation" className="scroll-mt-24">
        <TenderTranslationPanel
          tenderId={tender.id}
          currentSourceHash={translationSourceHash}
          translations={tender.translations}
          locale={locale}
        />
        </div>

        <div id="booklet" className="scroll-mt-24">
        {session && (
          <TenderBookletPanel
            tenderId={tender.id}
            booklets={tender.booklets}
            companyProfileUpdatedAt={companyProfile?.updatedAt ?? null}
            locale={locale}
          />
        )}
        </div>

        <div id="source-details" className="mt-6 grid scroll-mt-24 gap-6 lg:grid-cols-2">
          <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6">
            <h2 className="text-xl font-semibold">{pick(locale, "Opportunity summary", "ملخص الفرصة")}</h2>
            <dl className="mt-3">
              <DetailItem
                label={pick(locale, "Purpose / description", "الغرض / الوصف")}
                value={description.value}
                arabic={description.direction === "rtl"}
                locale={locale}
              />
              <DetailItem locale={locale} label={pick(locale, "Status", "الحالة")} value={localizedMetadata(metadataTranslations, "status", tender.tenderStatusNameArabic, locale)} arabic={locale === "ar"} />
              <DetailItem locale={locale} label={pick(locale, "Activity", "النشاط")} value={localizedMetadata(metadataTranslations, "activity", tender.activityNameArabic, locale)} arabic={locale === "ar"} />
              <DetailItem
                locale={locale}
                label={pick(locale, "Classification", "التصنيف")}
                value={localizedMetadata(metadataTranslations, "classification", tender.classificationFieldArabic, locale)}
                arabic={locale === "ar"}
              />
              <DetailItem
                locale={locale}
                label={pick(locale, "Submission method", "طريقة التقديم")}
                value={localizedMetadata(metadataTranslations, "submissionMethod", tender.submissionMethodArabic, locale)}
                arabic={locale === "ar"}
              />
              <DetailItem
                locale={locale}
                label={pick(locale, "Contract duration", "مدة العقد")}
                value={localizedMetadata(metadataTranslations, "contractDuration", tender.contractDurationArabic, locale)}
                arabic={locale === "ar"}
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
              <DetailItem locale={locale} label={pick(locale, "Region", "المنطقة")} value={localizedMetadata(metadataTranslations, "region", tender.executionRegionArabic, locale)} arabic={locale === "ar"} />
              <DetailItem locale={locale} label={pick(locale, "City", "المدينة")} value={localizedMetadata(metadataTranslations, "city", tender.executionCityArabic, locale)} arabic={locale === "ar"} />
              <DetailItem
                locale={locale}
                label={pick(locale, "Details", "التفاصيل")}
                value={localizedMetadata(metadataTranslations, "executionDetails", tender.executionDetailsArabic, locale)}
                arabic={locale === "ar"}
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
                value={localizedMetadata(metadataTranslations, "localContent", tender.localContentRequirementsArabic, locale)}
                arabic={locale === "ar"}
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
                    className="block font-semibold text-[var(--accent)] hover:underline"
                  >
                    {localizedMetadata(metadataTranslations, "attachment", attachment.nameArabic, locale)} ↗
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section id="notes" className="mt-6 scroll-mt-24 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <h2 className="text-xl font-semibold">{pick(locale, "Your note", "ملاحظتك")}</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {pick(locale, "Record questions, concerns, or next actions for this tender.", "سجل الأسئلة أو المخاوف أو الخطوات التالية لهذه المنافسة.")}
          </p>
          <form action={updateTenderNote} className="mt-4">
            <input type="hidden" name="tenderId" value={tender.id} />
            <textarea
              name="note"
              defaultValue={tender.decisions[0]?.note ?? ""}
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
