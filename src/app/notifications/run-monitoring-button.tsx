"use client";

import { useFormStatus } from "react-dom";

import { pick, type Locale } from "@/lib/i18n/locale";

export function RunMonitoringButton({ locale }: { locale: Locale }) {
  const { pending } = useFormStatus();

  return (
    <div className="grid justify-items-end gap-2">
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-70"
      >
        {pending && (
          <span
            aria-hidden="true"
            className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
          />
        )}
        {pending
          ? pick(locale, "Monitoring in progress...", "المراقبة قيد التشغيل...")
          : pick(locale, "Run monitoring now", "تشغيل المراقبة الآن")}
      </button>
      {pending && (
        <p
          aria-live="polite"
          className="max-w-64 text-right text-xs leading-5 text-[var(--muted)]"
        >
          {pick(
            locale,
            "Checking Etimad, updating tender records, and creating relevant notifications. This can take a minute.",
            "جارٍ التحقق من اعتماد وتحديث سجلات المنافسات وإنشاء التنبيهات المناسبة. قد يستغرق ذلك دقيقة.",
          )}
        </p>
      )}
    </div>
  );
}
