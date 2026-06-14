import Link from "next/link";

import { LanguageSwitcher } from "@/app/language-switcher";
import { tenderChatAnswerSchema } from "@/lib/ai/tender-chat-schema";
import { dateLocale, pick } from "@/lib/i18n/locale";
import { getLocale } from "@/lib/i18n/locale-server";
import { localizedTenderText } from "@/lib/i18n/tender-text";
import { prisma } from "@/lib/prisma";
import { requireWorkspace } from "@/lib/auth/session";

import { TenderChatControls } from "./chat-controls";
import { clearTenderConversationAction } from "./actions";

export const dynamic = "force-dynamic";

type PageParams = {
  view?: string | string[];
};

export default async function TenderChatPage({
  searchParams,
}: {
  searchParams: Promise<PageParams>;
}) {
  const params = await searchParams;
  const { workspace } = await requireWorkspace();
  const locale = await getLocale();
  const historyView =
    (Array.isArray(params.view) ? params.view[0] : params.view) === "history";
  const runs = await prisma.tenderChatRun.findMany({
    where: {
      workspaceId: workspace.id,
      clearedAt: historyView ? { not: null } : null,
    },
    orderBy: { generatedAt: "desc" },
    take: 20,
    include: {
      citations: {
        include: {
          tender: {
            select: {
              id: true,
              referenceNumber: true,
              titleArabic: true,
              titleEnglish: true,
            },
          },
        },
      },
    },
  });
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
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5 sm:px-8">
          <Link href="/tenders" className="font-semibold hover:text-[var(--accent)]">
            <span className="rtl-flip inline-block">←</span>{" "}
            {pick(locale, "Tender browser", "متصفح المنافسات")}
          </Link>
          <div className="flex items-center gap-4 text-sm font-semibold">
            <Link href="/company" className="hover:text-[var(--accent)]">
              {pick(locale, "Company profile", "ملف الشركة")}
            </Link>
            <LanguageSwitcher locale={locale} />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
        <section className="rounded-[2rem] border border-[var(--border)] bg-[linear-gradient(135deg,var(--foreground),#244e42)] p-7 text-white shadow-[0_24px_70px_rgba(20,55,43,0.18)] sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-200">
            {pick(locale, "Tender Intelligence AI", "ذكاء المنافسات")}
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
            {pick(locale, "Ask your tender database.", "اسأل قاعدة بيانات المنافسات.")}
          </h1>
          <p className="mt-4 max-w-3xl leading-7 text-white/70">
            {pick(
              locale,
              "Answers use only retrieved tender records stored locally. This is not a general Etimad assistant and it cannot access hidden portal information.",
              "تستخدم الإجابات سجلات المنافسات المسترجعة والمخزنة محلياً فقط. هذه ليست مساعدة عامة لاعتماد، ولا يمكنها الوصول إلى معلومات البوابة المخفية.",
            )}
          </p>
        </section>

        <section className="relative -mt-5 mx-4 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_18px_45px_rgba(20,55,43,0.1)] sm:mx-8 sm:p-8">
          <TenderChatControls locale={locale} />
        </section>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <div className="flex rounded-xl border border-[var(--border)] bg-white p-1 text-sm font-semibold">
            <Link
              href="/chat"
              className={`rounded-lg px-4 py-2 ${
                historyView ? "text-[var(--muted)]" : "bg-[var(--accent-soft)] text-[var(--accent-deep)]"
              }`}
            >
              {pick(locale, "Current conversation", "المحادثة الحالية")}
            </Link>
            <Link
              href="/chat?view=history"
              className={`rounded-lg px-4 py-2 ${
                historyView ? "bg-[var(--accent-soft)] text-[var(--accent-deep)]" : "text-[var(--muted)]"
              }`}
            >
              {pick(locale, "Cleared history", "سجل المحادثات الممسوحة")}
            </Link>
          </div>
          {!historyView && runs.length > 0 && (
            <form action={clearTenderConversationAction}>
              <button
                type="submit"
                className="rounded-xl border border-[var(--border-strong)] bg-white px-4 py-2 text-sm font-semibold text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                {pick(locale, "Clear conversation", "مسح المحادثة")}
              </button>
            </form>
          )}
        </div>

        <section className="mt-8 grid gap-5">
          {runs.length === 0 && (
            <p className="rounded-3xl border border-dashed border-[var(--border-strong)] bg-white p-10 text-center text-[var(--muted)]">
              {historyView
                ? pick(locale, "No cleared conversations yet.", "لا توجد محادثات ممسوحة بعد.")
                : pick(locale, "No questions in the current conversation yet.", "لا توجد أسئلة في المحادثة الحالية بعد.")}
            </p>
          )}

          {runs.map((run) => {
            const parsed = tenderChatAnswerSchema.safeParse(run.content);
            return (
              <article
                key={run.id}
                className="rounded-3xl border border-[var(--border)] bg-white p-6 shadow-[0_10px_35px_rgba(20,55,43,0.05)] sm:p-8"
              >
                <p className="text-xs text-[var(--muted)]">
                  {dateFormatter.format(run.generatedAt)} · {run.retrievedTenderCount}{" "}
                  {pick(locale, "records retrieved", "سجلاً مسترجعاً")}
                </p>
                <div className="mt-3 ml-auto max-w-[88%] rounded-2xl rounded-tr-sm bg-[var(--accent)] px-5 py-4 text-white">
                  <p className="text-xs font-semibold uppercase tracking-wide text-white/65">{pick(locale, "You asked", "سؤالك")}</p>
                  <h2 className="mt-1 font-semibold">{run.question}</h2>
                </div>

                {parsed.success ? (
                  <>
                    <div className="mt-5 max-w-[94%] rounded-2xl rounded-tl-sm bg-[var(--background)] px-5 py-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--accent)]">{pick(locale, "Tender Intelligence", "ذكاء المنافسات")}</p>
                      <p className="mt-2 whitespace-pre-wrap leading-7 text-[var(--muted)]">{parsed.data.answer}</p>
                    </div>
                    {parsed.data.unsupported && (
                      <span className="mt-4 inline-flex rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-800">
                        {pick(locale, "Insufficient retrieved data", "البيانات المسترجعة غير كافية")}
                      </span>
                    )}
                    {parsed.data.caveats.length > 0 && (
                      <ul className="mt-4 list-disc space-y-1 pl-5 text-sm leading-6 text-[var(--muted)]">
                        {parsed.data.caveats.map((caveat) => (
                          <li key={caveat}>{caveat}</li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : (
                  <p className="mt-4 text-sm text-red-700">
                    {pick(locale, "Stored answer does not match the current schema.", "الإجابة المخزنة لا تطابق البنية الحالية.")}
                  </p>
                )}

                {run.citations.length > 0 && (
                  <div className="mt-6 border-t border-[var(--border)] pt-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--accent)]">
                      {pick(locale, "Tender citations", "مراجع المنافسات")}
                    </p>
                    <ul className="mt-3 grid gap-3">
                      {run.citations.map((citation) => {
                        const title = localizedTenderText(
                          locale,
                          citation.tender.titleEnglish,
                          citation.tender.titleArabic,
                        );
                        return (
                          <li key={citation.id} className="rounded-xl bg-[var(--background)] p-4 text-sm">
                            <Link
                              href={`/tenders/${citation.tender.id}`}
                              className="font-semibold text-[var(--accent)] hover:underline"
                            >
                              {citation.tender.referenceNumber}: {title.value}
                            </Link>
                            <p className="mt-1 text-[var(--muted)]">{citation.claim}</p>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                <p className="mt-5 text-xs text-[var(--muted)]">
                  {run.model} · {run.promptVersion} · {run.totalTokens ?? "unknown"}{" "}
                  {pick(locale, "tokens", "رمز")}
                  {run.estimatedCostUsd
                    ? ` · ${pick(locale, "Estimated cost", "التكلفة التقديرية")} $${run.estimatedCostUsd.toString()}`
                    : ""}
                </p>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}
