import Link from "next/link";

import { LanguageSwitcher } from "@/app/language-switcher";
import { tenderChatAnswerSchema } from "@/lib/ai/tender-chat-schema";
import { dateLocale, pick } from "@/lib/i18n/locale";
import { getLocale } from "@/lib/i18n/locale-server";
import { localizedTenderText } from "@/lib/i18n/tender-text";
import { prisma } from "@/lib/prisma";

import { TenderChatControls } from "./chat-controls";

export const dynamic = "force-dynamic";

export default async function TenderChatPage() {
  const locale = await getLocale();
  const runs = await prisma.tenderChatRun.findMany({
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
        <section>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
            {pick(locale, "Grounded database questions", "أسئلة موثقة على قاعدة البيانات")}
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
            {pick(locale, "Ask your tender database.", "اسأل قاعدة بيانات المنافسات.")}
          </h1>
          <p className="mt-4 max-w-3xl leading-7 text-[var(--muted)]">
            {pick(
              locale,
              "Answers use only retrieved tender records stored locally. This is not a general Etimad assistant and it cannot access hidden portal information.",
              "تستخدم الإجابات سجلات المنافسات المسترجعة والمخزنة محلياً فقط. هذه ليست مساعدة عامة لاعتماد، ولا يمكنها الوصول إلى معلومات البوابة المخفية.",
            )}
          </p>
        </section>

        <section className="mt-8 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8">
          <TenderChatControls locale={locale} />
        </section>

        <section className="mt-8 grid gap-5">
          {runs.length === 0 && (
            <p className="rounded-3xl border border-dashed border-[var(--border-strong)] bg-white p-10 text-center text-[var(--muted)]">
              {pick(locale, "No stored questions yet.", "لا توجد أسئلة مخزنة بعد.")}
            </p>
          )}

          {runs.map((run) => {
            const parsed = tenderChatAnswerSchema.safeParse(run.content);
            return (
              <article
                key={run.id}
                className="rounded-3xl border border-[var(--border)] bg-white p-6 sm:p-8"
              >
                <p className="text-xs text-[var(--muted)]">
                  {dateFormatter.format(run.generatedAt)} · {run.retrievedTenderCount}{" "}
                  {pick(locale, "records retrieved", "سجلاً مسترجعاً")}
                </p>
                <h2 className="mt-3 text-xl font-semibold">{run.question}</h2>

                {parsed.success ? (
                  <>
                    <p className="mt-4 whitespace-pre-wrap leading-7 text-[var(--muted)]">
                      {parsed.data.answer}
                    </p>
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
