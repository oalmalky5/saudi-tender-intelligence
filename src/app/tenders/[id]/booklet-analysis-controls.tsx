"use client";

import { useActionState } from "react";

import { pick, type Locale } from "@/lib/i18n/locale";
import {
  analyzeTenderBookletAction,
  type BookletAnalysisActionState,
} from "./booklet-analysis-actions";

const initialState: BookletAnalysisActionState = {
  status: "idle",
  message: "",
};

export function BookletAnalysisControls({
  bookletId,
  locale,
  disabled,
  hasAnalysis,
}: {
  bookletId: string;
  locale: Locale;
  disabled: boolean;
  hasAnalysis: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    analyzeTenderBookletAction,
    initialState,
  );

  return (
    <form action={formAction}>
      <input type="hidden" name="bookletId" value={bookletId} />
      <input type="hidden" name="locale" value={locale} />
      <button
        type="submit"
        disabled={pending || disabled}
        className="rounded-xl bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending
          ? pick(locale, "Analyzing...", "جارٍ التحليل...")
          : hasAnalysis
            ? pick(locale, "Check cached analysis", "التحقق من التحليل المخزن")
            : pick(locale, "Analyze booklet with AI", "تحليل الكراسة بالذكاء الاصطناعي")}
      </button>
      {state.message && (
        <p
          aria-live="polite"
          className={`mt-2 max-w-md text-xs leading-5 ${
            state.status === "error" ? "text-red-700" : "text-[var(--muted)]"
          }`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
