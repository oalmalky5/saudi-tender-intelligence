import { dateLocale, pick, type Locale } from "@/lib/i18n/locale";
import {
  estimateBookletAnalysisCostUsd,
  selectBookletPages,
} from "@/lib/ai/booklet-analysis-context";
import {
  bookletAnalysisSchema,
  type BookletFinding,
} from "@/lib/ai/booklet-analysis-schema";

import { BookletAnalysisControls } from "./booklet-analysis-controls";
import { BookletUploadControls } from "./booklet-upload-controls";

type StoredBooklet = {
  id: string;
  originalName: string;
  sizeBytes: number;
  sha256: string;
  pageCount: number;
  extractedCharacters: number;
  extractionStatus: string;
  extractionMethod: string;
  requiresOcr: boolean;
  createdAt: Date;
  pages: Array<{
    id: string;
    pageNumber: number;
    text: string;
    characterCount: number;
  }>;
  analyses: Array<{
    id: string;
    content: unknown;
    model: string;
    promptVersion: string;
    schemaVersion: string;
    inputTokens: number | null;
    outputTokens: number | null;
    totalTokens: number | null;
    estimatedCostUsd: { toString(): string } | null;
    sourceBookletSha256: string;
    sourceCompanyProfileUpdatedAt: Date | null;
    analyzedPageNumbers: number[];
    generatedAt: Date;
  }>;
};

function formatSize(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function AnalysisSection({
  title,
  findings,
}: {
  title: string;
  findings: BookletFinding[];
}) {
  if (findings.length === 0) {
    return null;
  }

  return (
    <div>
      <h4 className="font-semibold">{title}</h4>
      <div className="mt-2 grid gap-3">
        {findings.map((finding, index) => (
          <div key={`${finding.statement}-${index}`} className="rounded-xl bg-white p-4">
            <p className="text-sm leading-6">{finding.statement}</p>
            <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)]">
              {finding.sourceType.replaceAll("_", " ")} · {finding.confidence} confidence
            </p>
            <ul className="mt-2 grid gap-1 text-xs leading-5 text-[var(--muted)]">
              {finding.citations.map((citation) => (
                <li key={`${citation.pageNumber}-${citation.excerpt}`}>
                  Page {citation.pageNumber}: “{citation.excerpt}”
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TenderBookletPanel({
  tenderId,
  booklets,
  companyProfileUpdatedAt,
  locale,
}: {
  tenderId: string;
  booklets: StoredBooklet[];
  companyProfileUpdatedAt: Date | null;
  locale: Locale;
}) {
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
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div>
          <h2 className="text-xl font-semibold">
            {pick(locale, "Conditions booklet analysis", "تحليل كراسة الشروط")}
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            {pick(
              locale,
              "Upload a booklet obtained through your authorized Etimad access. The original PDF is preserved locally and text extraction makes no AI request.",
              "ارفع كراسة حصلت عليها من خلال وصولك المصرح به إلى اعتماد. يُحفظ ملف PDF الأصلي محلياً، ولا يستخدم استخراج النص الذكاء الاصطناعي.",
            )}
          </p>
          <p className="mt-3 text-xs leading-5 text-[var(--muted)]">
            {pick(locale, "PDF only · maximum 25 MB · stored locally · not committed to Git", "ملف PDF فقط · حد أقصى 25 ميجابايت · يُخزن محلياً · لا يُرفع إلى Git")}
          </p>
        </div>
        <BookletUploadControls tenderId={tenderId} locale={locale} />
      </div>

      {booklets.length === 0 ? (
        <p className="mt-6 rounded-2xl bg-[var(--background)] p-5 text-sm text-[var(--muted)]">
          {pick(locale, "No conditions booklet has been uploaded for this tender.", "لم يتم رفع كراسة شروط لهذه المنافسة.")}
        </p>
      ) : (
        <div className="mt-6 grid gap-4">
          {booklets.map((booklet) => (
            (() => {
              const selectedPages = selectBookletPages(booklet.pages);
              const estimatedCost = estimateBookletAnalysisCostUsd(selectedPages);
              const latestAnalysis = booklet.analyses[0] ?? null;
              const parsedAnalysis = latestAnalysis
                ? bookletAnalysisSchema.safeParse(latestAnalysis.content)
                : null;
              const analysisIsStale =
                latestAnalysis !== null &&
                (latestAnalysis.sourceBookletSha256 !== booklet.sha256 ||
                  (companyProfileUpdatedAt !== null &&
                    (latestAnalysis.sourceCompanyProfileUpdatedAt === null ||
                      companyProfileUpdatedAt >
                        latestAnalysis.sourceCompanyProfileUpdatedAt)));

              return (
            <article
              key={booklet.id}
              className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-semibold">{booklet.originalName}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {dateFormatter.format(booklet.createdAt)} · {formatSize(booklet.sizeBytes)} ·{" "}
                    {booklet.pageCount} {pick(locale, "pages", "صفحة")} ·{" "}
                    {booklet.extractedCharacters.toLocaleString(dateLocale(locale))}{" "}
                    {pick(locale, "extracted characters", "حرف مستخرج")}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                    booklet.requiresOcr
                      ? "bg-amber-100 text-amber-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {booklet.requiresOcr
                    ? pick(locale, "OCR review required", "يحتاج مراجعة التعرف الضوئي")
                    : pick(locale, "Text extraction ready", "استخراج النص جاهز")}
                </span>
              </div>
              <p className="mt-3 text-xs text-[var(--muted)]">
                SHA-256: <code>{booklet.sha256.slice(0, 16)}…</code> · {booklet.extractionMethod}
              </p>
              <div className="mt-4 flex flex-wrap items-start justify-between gap-4 border-t border-[var(--border)] pt-4">
                <p className="max-w-xl text-xs leading-5 text-[var(--muted)]">
                  {pick(locale, "Estimated AI analysis", "تحليل الذكاء الاصطناعي التقديري")}:{" "}
                  ${estimatedCost.toFixed(4)} · {selectedPages.length}{" "}
                  {pick(locale, "selected pages", "صفحة مختارة")} ·{" "}
                  {pick(locale, "actual cost is stored after analysis", "تُخزن التكلفة الفعلية بعد التحليل")}
                </p>
                <BookletAnalysisControls
                  bookletId={booklet.id}
                  locale={locale}
                  disabled={booklet.requiresOcr}
                  hasAnalysis={latestAnalysis !== null}
                />
              </div>

              {booklet.pages.length > 0 && (
                <details className="mt-4 border-t border-[var(--border)] pt-4">
                  <summary className="cursor-pointer text-sm font-semibold">
                    {pick(locale, "Preview extracted page text", "معاينة نص الصفحات المستخرج")}
                  </summary>
                  <div className="mt-3 grid gap-3">
                    {booklet.pages.slice(0, 3).map((page) => (
                      <div key={page.id} className="rounded-xl bg-white p-4">
                        <p className="text-xs font-semibold text-[var(--accent)]">
                          {pick(locale, "Page", "الصفحة")} {page.pageNumber} · {page.characterCount}{" "}
                          {pick(locale, "characters", "حرفاً")}
                        </p>
                        <p dir="rtl" lang="ar" className="mt-2 line-clamp-5 text-right text-sm leading-7 text-[var(--muted)]">
                          {page.text || pick(locale, "No text extracted.", "لم يتم استخراج نص.")}
                        </p>
                      </div>
                    ))}
                  </div>
                </details>
              )}

              {latestAnalysis && (
                <details className="mt-4 border-t border-[var(--border)] pt-4" open>
                  <summary className="cursor-pointer text-sm font-semibold">
                    {pick(locale, "View latest cited analysis", "عرض أحدث تحليل موثق")}
                  </summary>
                  <div dir="ltr" lang="en" className="mt-4">
                    <div className="flex flex-wrap gap-2 text-xs font-medium">
                      <span className="rounded-full bg-white px-3 py-1.5 text-[var(--muted)]">
                        {dateFormatter.format(latestAnalysis.generatedAt)}
                      </span>
                      <span className="rounded-full bg-white px-3 py-1.5 text-[var(--muted)]">
                        {latestAnalysis.model} · {latestAnalysis.promptVersion}
                      </span>
                      {analysisIsStale && (
                        <span className="rounded-full bg-amber-100 px-3 py-1.5 text-amber-800">
                          Stale: booklet or company profile changed
                        </span>
                      )}
                    </div>

                    {parsedAnalysis?.success ? (
                      <div className="mt-5 grid gap-6">
                        <AnalysisSection title="Executive summary" findings={parsedAnalysis.data.executiveSummary} />
                        <AnalysisSection title="Scope and deliverables" findings={parsedAnalysis.data.scopeAndDeliverables} />
                        <AnalysisSection title="Eligibility requirements" findings={parsedAnalysis.data.eligibilityRequirements} />
                        <AnalysisSection title="Licenses, certificates, and documents" findings={parsedAnalysis.data.licensesCertificatesDocuments} />
                        <AnalysisSection title="Staffing and qualifications" findings={parsedAnalysis.data.staffingQualifications} />
                        <AnalysisSection title="Submission and evaluation" findings={parsedAnalysis.data.submissionEvaluation} />
                        <AnalysisSection title="Guarantees, penalties, and risks" findings={parsedAnalysis.data.guaranteesPenaltiesRisks} />
                        <AnalysisSection title="Local-content requirements" findings={parsedAnalysis.data.localContentRequirements} />
                        <AnalysisSection title="Questions and unclear points" findings={parsedAnalysis.data.questionsUnclearPoints} />
                        <AnalysisSection title="Company-fit notes" findings={parsedAnalysis.data.companyFitNotes} />
                        <AnalysisSection title="Standard boilerplate" findings={parsedAnalysis.data.standardBoilerplate} />
                      </div>
                    ) : (
                      <p className="mt-4 text-sm text-red-700">
                        Stored analysis does not match the current schema.
                      </p>
                    )}

                    <p className="mt-5 text-xs leading-5 text-[var(--muted)]">
                      {latestAnalysis.analyzedPageNumbers.length} pages analyzed ·{" "}
                      {latestAnalysis.totalTokens ?? "unknown"} tokens
                      {latestAnalysis.estimatedCostUsd
                        ? ` · Estimated actual cost $${latestAnalysis.estimatedCostUsd.toString()}`
                        : ""}
                    </p>
                  </div>
                </details>
              )}
            </article>
              );
            })()
          ))}
        </div>
      )}
    </section>
  );
}
