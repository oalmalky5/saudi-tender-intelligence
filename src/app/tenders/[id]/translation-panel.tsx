import { dateLocale, pick, type Locale } from "@/lib/i18n/locale";

import { TranslationControls } from "./translation-controls";

type StoredTranslation = {
  id: string;
  titleEnglish: string;
  descriptionEnglish: string | null;
  sourceHash: string;
  provider: string;
  translationType: string;
  model: string;
  promptVersion: string;
  characterCount: number | null;
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
  estimatedCostUsd: { toString(): string } | null;
  generatedAt: Date;
};

export function TenderTranslationPanel({
  tenderId,
  currentSourceHash,
  translations,
  locale,
}: {
  tenderId: string;
  currentSourceHash: string;
  translations: StoredTranslation[];
  locale: Locale;
}) {
  const latest = translations[0] ?? null;
  const isStale = latest !== null && latest.sourceHash !== currentSourceHash;
  const dateFormatter = new Intl.DateTimeFormat(dateLocale(locale), {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Riyadh",
  });

  return (
    <section className="mt-6 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <h2 className="text-xl font-semibold">
            {pick(locale, "English tender translation", "ترجمة المنافسة إلى الإنجليزية")}
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            {pick(
              locale,
              "Automatically translated for English browsing, with an optional OpenAI improvement. The Arabic source remains authoritative.",
              "تُترجم تلقائياً للتصفح باللغة الإنجليزية مع تحسين اختياري عبر OpenAI، ويبقى المصدر العربي هو المرجع المعتمد.",
            )}
          </p>
        </div>
        <TranslationControls
          tenderId={tenderId}
          locale={locale}
          hasTranslation={latest !== null}
        />
      </div>

      {!latest && (
        <p className="mt-6 rounded-2xl bg-[var(--background)] p-5 text-sm text-[var(--muted)]">
          {pick(locale, "No English translation has been generated for this tender yet.", "لم يتم إنشاء ترجمة إنجليزية لهذه المنافسة بعد.")}
        </p>
      )}

      {latest && (
        <div className="mt-6 border-t border-[var(--border)] pt-6" dir="ltr" lang="en">
          <div className="flex flex-wrap gap-2 text-xs font-medium">
            <span className="rounded-full bg-[var(--background)] px-3 py-1.5 text-[var(--muted)]">
              Generated {dateFormatter.format(latest.generatedAt)}
            </span>
            <span className="rounded-full bg-[var(--background)] px-3 py-1.5 text-[var(--muted)]">
              {latest.model} · {latest.promptVersion}
            </span>
            <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1.5 text-[var(--accent)]">
              {latest.provider === "AZURE"
                ? "Automatic machine translation"
                : "OpenAI improved translation"}
            </span>
            {isStale && (
              <span className="rounded-full bg-amber-100 px-3 py-1.5 text-amber-800">
                Stale: Arabic title or description changed
              </span>
            )}
          </div>

          <h3 className="mt-5 text-lg font-semibold">{latest.titleEnglish}</h3>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[var(--muted)]">
            {latest.descriptionEnglish ?? "No public description was provided."}
          </p>

          <p className="mt-6 text-xs leading-5 text-[var(--muted)]">
            {latest.provider === "AZURE"
              ? `Usage: ${latest.characterCount ?? "unknown"} translated characters`
              : `Usage: ${latest.inputTokens ?? "unknown"} input tokens · ${
                  latest.outputTokens ?? "unknown"
                } output tokens · ${latest.totalTokens ?? "unknown"} total tokens${
                  latest.estimatedCostUsd
                    ? ` · Estimated cost $${latest.estimatedCostUsd.toString()}`
                    : ""
                }`}
            {" · "}
            {translations.length} stored {translations.length === 1 ? "version" : "versions"}
          </p>
        </div>
      )}
    </section>
  );
}
