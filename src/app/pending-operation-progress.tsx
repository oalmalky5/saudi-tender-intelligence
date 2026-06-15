import { pick, type Locale } from "@/lib/i18n/locale";

export function PendingOperationProgress({
  locale,
  message,
  messageArabic,
}: {
  locale: Locale;
  message: string;
  messageArabic: string;
}) {
  return (
    <div aria-live="polite" className="grid w-full max-w-72 gap-2">
      <div
        role="progressbar"
        aria-label={pick(locale, "Operation in progress", "العملية قيد التنفيذ")}
        className="operation-progress"
      >
        <span />
      </div>
      <p className="text-right text-xs leading-5 text-[var(--muted)]">
        {pick(locale, message, messageArabic)}
      </p>
      <p className="text-right text-xs font-semibold leading-5 text-[var(--accent-deep)]">
        {pick(
          locale,
          "Please keep this page open until the check completes.",
          "يرجى إبقاء هذه الصفحة مفتوحة حتى اكتمال التحقق.",
        )}
      </p>
    </div>
  );
}
