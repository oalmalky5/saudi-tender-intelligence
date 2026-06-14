import { prisma } from "@/lib/prisma";
import { scoreTenderMatch } from "@/lib/matching/score-tender";
import Link from "next/link";
import { DecisionControls } from "../decision-controls";
import { LanguageSwitcher } from "@/app/language-switcher";
import { dateLocale, pick, type Locale } from "@/lib/i18n/locale";
import { getLocale } from "@/lib/i18n/locale-server";
import { localizeMatchText } from "@/lib/i18n/match-text";
import { localizedTenderText } from "@/lib/i18n/tender-text";
import { AiMatchingPanel } from "./ai-matching-panel";

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

function scoreTone(score: number): string {
  if (score >= 70) {
    return "bg-[var(--accent)] text-white";
  }
  if (score >= 40) {
    return "bg-amber-100 text-amber-900";
  }
  return "bg-[var(--background)] text-[var(--muted)]";
}

export default async function RecommendedTendersPage() {
  const locale = await getLocale();
  const [profile, tenders, latestAiRun] = await Promise.all([
    prisma.companyProfile.findUnique({ where: { id: "primary" } }),
    prisma.tender.findMany({
      where: { NOT: { decision: { is: { status: "IGNORED" } } } },
      orderBy: { publishedAt: "desc" },
      take: 120,
      select: {
        id: true,
        referenceNumber: true,
        titleArabic: true,
        titleEnglish: true,
        descriptionArabic: true,
        agencyNameArabic: true,
        activityNameArabic: true,
        classificationFieldArabic: true,
        executionRegionArabic: true,
        tenderTypeNameArabic: true,
        submissionDeadline: true,
        detailEnrichmentStatus: true,
        decision: { select: { status: true } },
      },
    }),
    prisma.tenderAiMatchRun.findFirst({
      where: { companyProfileId: "primary" },
      orderBy: { generatedAt: "desc" },
      include: {
        matches: {
          orderBy: { rank: "asc" },
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

  const recommendations = profile
    ? tenders
        .map((tender) => ({
          tender,
          match: scoreTenderMatch(profile, tender),
        }))
        .filter(({ match }) => match.hasDirectScopeMatch)
        .sort(
          (left, right) =>
            right.match.score - left.match.score ||
            left.tender.referenceNumber.localeCompare(
              right.tender.referenceNumber,
            ),
        )
    : [];

  return (
    <main className="min-h-screen">
      <header className="border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
          <Link href="/tenders" className="font-semibold hover:text-[var(--accent)]">
            <span className="rtl-flip inline-block">←</span>{" "}
            {pick(locale, "Discover tenders", "اكتشاف المنافسات")}
          </Link>
          <div className="flex items-center gap-4 text-sm font-semibold">
            <Link href="/company" className="hover:text-[var(--accent)]">
              {pick(locale, "Company profile", "ملف الشركة")}
            </Link>
            <Link href="/tenders/saved" className="hover:text-[var(--accent)]">
              {pick(locale, "Saved", "المحفوظة")}
            </Link>
            <LanguageSwitcher locale={locale} />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <section className="border-b border-[var(--border)] pb-9">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
            {pick(locale, "Rule-based matching", "مطابقة قائمة على القواعد")}
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
            {pick(locale, "Recommended opportunities", "الفرص الموصى بها")}
          </h1>
          <p className="mt-4 max-w-3xl leading-7 text-[var(--muted)]">
            {pick(locale, "Tenders are ranked using explicit company preferences and available public data. Scores indicate relevance, not confirmed eligibility.", "يتم ترتيب المنافسات باستخدام تفضيلات الشركة الصريحة والبيانات العامة المتاحة. تشير الدرجات إلى الصلة، وليس إلى أهلية مؤكدة.")}
          </p>
        </section>

        {!profile ? (
          <section className="mt-8 rounded-3xl border border-dashed border-[var(--border-strong)] bg-white px-6 py-16 text-center">
            <h2 className="text-xl font-semibold">{pick(locale, "Create a company profile first", "أنشئ ملف الشركة أولاً")}</h2>
            <p className="mt-2 text-[var(--muted)]">
              {pick(locale, "Recommendations need structured services, activities, keywords, and preferences.", "تحتاج التوصيات إلى خدمات وأنشطة وكلمات مفتاحية وتفضيلات منظمة.")}
            </p>
            <Link
              href="/company"
              className="mt-5 inline-flex rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white"
            >
              {pick(locale, "Create company profile", "إنشاء ملف الشركة")}
            </Link>
          </section>
        ) : (
          <>
            <section className="mt-8 rounded-2xl border border-[var(--border)] bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{profile.companyName}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {pick(locale, "Found", "تم العثور على")} {recommendations.length}{" "}
                    {pick(locale, "relevant candidates from", "مرشحاً مناسباً من")}{" "}
                    {tenders.length} {pick(locale, "non-ignored tenders.", "منافسة غير مستبعدة.")}
                  </p>
                </div>
                <Link
                  href="/company"
                  className="text-sm font-semibold text-[var(--accent)] hover:underline"
                >
                  {pick(locale, "Edit matching profile", "تعديل ملف المطابقة")} <span className="rtl-flip inline-block">→</span>
                </Link>
              </div>
            </section>

            <AiMatchingPanel
              locale={locale}
              profileUpdatedAt={profile.updatedAt}
              run={latestAiRun}
            />

            {recommendations.length === 0 ? (
              <section className="mt-8 rounded-3xl border border-dashed border-[var(--border-strong)] bg-white px-6 py-16 text-center">
                <h2 className="text-xl font-semibold">{pick(locale, "No explicit matches yet", "لا توجد مطابقات صريحة بعد")}</h2>
                <p className="mt-2 text-[var(--muted)]">
                  {pick(locale, "Add more activities, services, keywords, or target entities to the company profile.", "أضف المزيد من الأنشطة أو الخدمات أو الكلمات المفتاحية أو الجهات المستهدفة إلى ملف الشركة.")}
                </p>
              </section>
            ) : (
              <div className="mt-6 grid gap-5">
                {recommendations.map(({ tender, match }) => (
                (() => {
                  const title = localizedTenderText(locale, tender.titleEnglish, tender.titleArabic);
                  return (
                <article
                  key={tender.id}
                  className="rounded-3xl border border-[var(--border)] bg-white p-5 sm:p-7"
                >
                  <div className="grid gap-6 lg:grid-cols-[7rem_minmax(0,1fr)_14rem]">
                    <div>
                      <div
                        className={`flex h-20 w-20 flex-col items-center justify-center rounded-2xl ${scoreTone(match.score)}`}
                      >
                        <span className="text-2xl font-semibold">{match.score}%</span>
                        <span className="text-[10px] font-semibold uppercase tracking-wide">
                          {pick(locale, "relevance", "صلة")}
                        </span>
                      </div>
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-medium text-[var(--muted)]">
                        {pick(locale, "Ref.", "المرجع")} {tender.referenceNumber}
                      </p>
                      <Link
                        href={`/tenders/${tender.id}`}
                        dir={title.direction}
                        lang={title.language}
                        className={`mt-2 block text-xl font-semibold leading-8 hover:text-[var(--accent)] ${
                          title.direction === "rtl" ? "text-right" : ""
                        }`}
                      >
                        {title.value}
                      </Link>
                      <p
                        dir="rtl"
                        lang="ar"
                        className="mt-2 text-right text-sm text-[var(--muted)]"
                      >
                        {tender.agencyNameArabic}
                      </p>

                      {match.reasons.length > 0 ? (
                        <div className="mt-5">
                          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--accent)]">
                            {pick(locale, "Why it matches", "أسباب المطابقة")}
                          </p>
                          <ul className="mt-2 grid gap-1.5 text-sm leading-6">
                            {match.reasons.map((reason) => (
                              <li key={reason}>+ {localizeMatchText(reason, locale)}</li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <p className="mt-5 text-sm text-[var(--muted)]">
                          {pick(locale, "No explicit profile preferences matched.", "لم تتطابق تفضيلات صريحة من ملف الشركة.")}
                        </p>
                      )}

                      {match.concerns.length > 0 && (
                        <div className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
                          <p className="font-semibold">{pick(locale, "Possible concerns", "مخاوف محتملة")}</p>
                          <ul className="mt-1.5 grid gap-1 leading-6">
                            {match.concerns.map((concern) => (
                              <li key={concern}>- {localizeMatchText(concern, locale)}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-[var(--border)] pt-4 text-sm lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
                      <p className="text-xs text-[var(--muted)]">
                        {pick(locale, "Submission deadline", "آخر موعد للتقديم")}
                      </p>
                      <p className="mt-1 font-semibold">
                        {formatDate(tender.submissionDeadline, locale)}
                      </p>
                      <p className="mt-4 text-xs text-[var(--muted)]">
                        {pick(locale, "Activity", "النشاط")}
                      </p>
                      <p dir="rtl" lang="ar" className="mt-1 text-right">
                        {tender.activityNameArabic ?? pick(locale, "Not provided", "غير متاح")}
                      </p>
                      <div className="mt-5">
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
          </>
        )}
      </div>
    </main>
  );
}
