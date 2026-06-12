import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { DecisionControls } from "../decision-controls";
import { LanguageSwitcher } from "@/app/language-switcher";
import { pick } from "@/lib/i18n/locale";
import { getLocale } from "@/lib/i18n/locale-server";
import { localizedTenderText } from "@/lib/i18n/tender-text";

export const dynamic = "force-dynamic";

type SavedPageParams = {
  view?: string | string[];
};

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function SavedTendersPage({
  searchParams,
}: {
  searchParams: Promise<SavedPageParams>;
}) {
  const view = first((await searchParams).view) === "ignored" ? "ignored" : "saved";
  const locale = await getLocale();
  const status = view === "ignored" ? "IGNORED" : "SAVED";
  const decisions = await prisma.tenderDecision.findMany({
    where: { status },
    orderBy: { updatedAt: "desc" },
    include: {
      tender: {
        select: {
          id: true,
          referenceNumber: true,
          titleArabic: true,
          titleEnglish: true,
          agencyNameArabic: true,
          activityNameArabic: true,
          submissionDeadline: true,
        },
      },
    },
  });

  return (
    <main className="min-h-screen">
      <header className="border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
          <Link href="/tenders" className="font-semibold hover:text-[var(--accent)]">
            <span className="rtl-flip inline-block">←</span>{" "}
            {pick(locale, "Tender browser", "متصفح المنافسات")}
          </Link>
          <div className="flex items-center gap-4 text-sm font-semibold">
            <Link href="/company" className="hover:text-[var(--accent)]">
              {pick(locale, "Company profile", "ملف الشركة")}
            </Link>
            <span className="text-[var(--muted)]">{pick(locale, "Decision workspace", "مساحة القرارات")}</span>
            <LanguageSwitcher locale={locale} />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <h1 className="text-4xl font-semibold tracking-[-0.04em]">
          {pick(locale, "Manage tender decisions", "إدارة قرارات المنافسات")}
        </h1>
        <p className="mt-3 max-w-2xl leading-7 text-[var(--muted)]">
          {pick(locale, "Saved tenders stay visible here. Ignored tenders are hidden from the default browser but can always be restored.", "تبقى المنافسات المحفوظة ظاهرة هنا. يتم إخفاء المنافسات المستبعدة من المتصفح الافتراضي ويمكن استعادتها دائماً.")}
        </p>

        <nav className="mt-7 flex gap-2">
          <Link
            href="/tenders/saved"
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${
              view === "saved"
                ? "bg-[var(--accent)] text-white"
                : "border border-[var(--border)] bg-white"
            }`}
          >
            {pick(locale, "Saved", "المحفوظة")}
          </Link>
          <Link
            href="/tenders/saved?view=ignored"
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${
              view === "ignored"
                ? "bg-[var(--muted)] text-white"
                : "border border-[var(--border)] bg-white"
            }`}
          >
            {pick(locale, "Ignored", "المستبعدة")}
          </Link>
        </nav>

        {decisions.length === 0 ? (
          <section className="mt-8 rounded-3xl border border-dashed border-[var(--border-strong)] bg-white px-6 py-16 text-center">
            <h2 className="text-xl font-semibold">
              {view === "saved"
                ? pick(locale, "No saved tenders yet", "لا توجد منافسات محفوظة بعد")
                : pick(locale, "No ignored tenders yet", "لا توجد منافسات مستبعدة بعد")}
            </h2>
            <p className="mt-2 text-[var(--muted)]">
              {pick(locale, "Decisions made in the tender browser will appear here.", "ستظهر هنا القرارات التي تتخذها في متصفح المنافسات.")}
            </p>
          </section>
        ) : (
          <div className="mt-8 grid gap-4">
            {decisions.map((decision) => (
              (() => {
                const title = localizedTenderText(
                  locale,
                  decision.tender.titleEnglish,
                  decision.tender.titleArabic,
                );
                return (
              <article
                key={decision.id}
                className="rounded-2xl border border-[var(--border)] bg-white p-5 sm:p-6"
              >
                <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
                  <div>
                    <p className="text-xs font-medium text-[var(--muted)]">
                      {pick(locale, "Ref.", "المرجع")} {decision.tender.referenceNumber}
                    </p>
                    <Link
                      href={`/tenders/${decision.tender.id}`}
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
                      {decision.tender.agencyNameArabic}
                    </p>
                    {decision.note && (
                      <p className="mt-4 rounded-xl bg-[var(--background)] p-4 text-sm leading-6">
                        {decision.note}
                      </p>
                    )}
                  </div>
                  <DecisionControls
                    tenderId={decision.tender.id}
                    status={decision.status}
                    locale={locale}
                  />
                </div>
              </article>
                );
              })()
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
