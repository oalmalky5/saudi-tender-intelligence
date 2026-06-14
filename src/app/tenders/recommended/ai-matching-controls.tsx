"use client";

import { useActionState } from "react";

import { pick, type Locale } from "@/lib/i18n/locale";
import {
  generateAiMatchingAction,
  type AiMatchingActionState,
} from "./ai-matching-actions";

const initialState: AiMatchingActionState = {
  status: "idle",
  message: "",
};

export function AiMatchingControls({
  locale,
  hasRun,
}: {
  locale: Locale;
  hasRun: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    generateAiMatchingAction,
    initialState,
  );

  return (
    <form action={formAction}>
      <input type="hidden" name="locale" value={locale} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
      >
        {pending
          ? pick(locale, "Ranking candidates...", "جارٍ ترتيب المرشحين...")
          : hasRun
            ? pick(locale, "Refresh AI shortlist", "تحديث القائمة الذكية")
            : pick(locale, "Find relevant tenders with AI", "اكتشاف المنافسات المناسبة بالذكاء الاصطناعي")}
      </button>
      {state.message && (
        <p
          aria-live="polite"
          className={`mt-3 max-w-md text-sm ${
            state.status === "error" ? "text-red-700" : "text-[var(--muted)]"
          }`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
