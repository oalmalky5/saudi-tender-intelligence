"use client";

import { useFormStatus } from "react-dom";

import { PendingOperationProgress } from "@/app/pending-operation-progress";
import { pick, type Locale } from "@/lib/i18n/locale";

export function RefreshDiscoveryButton({ locale }: { locale: Locale }) {
  const { pending } = useFormStatus();

  return (
    <div className="grid justify-items-end gap-2">
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-xl bg-[var(--foreground)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--accent-deep)] disabled:cursor-wait disabled:opacity-70"
      >
        {pending && (
          <span
            aria-hidden="true"
            className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
          />
        )}
        {pending
          ? pick(locale, "Checking Etimad...", "جارٍ التحقق من اعتماد...")
          : pick(locale, "Refresh from Etimad", "تحديث من اعتماد")}
      </button>
      {pending && (
        <PendingOperationProgress
          locale={locale}
          message="Importing the latest public tenders and updating changed records. This can take a minute."
          messageArabic="جارٍ استيراد أحدث المنافسات العامة وتحديث السجلات المتغيرة. قد يستغرق ذلك دقيقة."
        />
      )}
    </div>
  );
}
