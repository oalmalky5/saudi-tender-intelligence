"use client";

import { useActionState } from "react";

import { pick, type Locale } from "@/lib/i18n/locale";
import {
  uploadTenderBookletAction,
  type BookletUploadActionState,
} from "./booklet-actions";

const initialState: BookletUploadActionState = {
  status: "idle",
  message: "",
};

export function BookletUploadControls({
  tenderId,
  locale,
}: {
  tenderId: string;
  locale: Locale;
}) {
  const [state, formAction, pending] = useActionState(
    uploadTenderBookletAction,
    initialState,
  );

  return (
    <form action={formAction} className="grid gap-3">
      <input type="hidden" name="tenderId" value={tenderId} />
      <input type="hidden" name="locale" value={locale} />
      <input
        type="file"
        name="booklet"
        accept="application/pdf,.pdf"
        required
        className="block w-full rounded-xl border border-[var(--border)] bg-white p-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--accent-soft)] file:px-3 file:py-2 file:font-semibold file:text-[var(--accent)]"
      />
      <button
        type="submit"
        disabled={pending}
        className="justify-self-start rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
      >
        {pending
          ? pick(locale, "Extracting PDF locally...", "جارٍ استخراج ملف PDF محلياً...")
          : pick(locale, "Upload and extract booklet", "رفع الكراسة واستخراجها")}
      </button>
      {state.message && (
        <p
          aria-live="polite"
          className={`text-sm leading-6 ${
            state.status === "error" ? "text-red-700" : "text-[var(--muted)]"
          }`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
