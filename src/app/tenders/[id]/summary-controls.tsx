"use client";

import { useActionState } from "react";

import {
  generateTenderSummaryAction,
  initialSummaryActionState,
} from "./summary-actions";
import { pick, type Locale } from "@/lib/i18n/locale";

export function SummaryControls({
  tenderId,
  locale,
}: {
  tenderId: string;
  locale: Locale;
}) {
  const [state, formAction, pending] = useActionState(
    generateTenderSummaryAction,
    initialSummaryActionState,
  );

  return (
    <form action={formAction}>
      <input type="hidden" name="tenderId" value={tenderId} />
      <input type="hidden" name="locale" value={locale} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
      >
        {pending
          ? pick(locale, "Generating summary...", "جارٍ إنشاء الملخص...")
          : pick(locale, "Summarize tender", "تلخيص المنافسة")}
      </button>
      {state.message && (
        <p
          aria-live="polite"
          className={`mt-3 text-sm ${
            state.status === "error" ? "text-red-700" : "text-[var(--muted)]"
          }`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
