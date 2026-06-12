"use client";

import { useActionState } from "react";

import { pick, type Locale } from "@/lib/i18n/locale";
import {
  translateTenderAction,
  type TranslationActionState,
} from "./translation-actions";

const initialTranslationActionState: TranslationActionState = {
  status: "idle",
  message: "",
};

export function TranslationControls({
  tenderId,
  locale,
  hasTranslation,
}: {
  tenderId: string;
  locale: Locale;
  hasTranslation: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    translateTenderAction,
    initialTranslationActionState,
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
          ? pick(locale, "Translating...", "جارٍ الترجمة...")
          : hasTranslation
            ? pick(locale, "Refresh translation", "تحديث الترجمة")
            : pick(locale, "Translate to English", "ترجمة إلى الإنجليزية")}
      </button>
      {state.message && (
        <p
          aria-live="polite"
          className={`mt-3 max-w-sm text-sm ${
            state.status === "error" ? "text-red-700" : "text-[var(--muted)]"
          }`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
