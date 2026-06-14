"use client";

import { useActionState } from "react";

import { pick, type Locale } from "@/lib/i18n/locale";
import {
  askTenderDatabaseAction,
  type TenderChatActionState,
} from "./actions";

const initialState: TenderChatActionState = {
  status: "idle",
  message: "",
};

export function TenderChatControls({ locale }: { locale: Locale }) {
  const [state, formAction, pending] = useActionState(
    askTenderDatabaseAction,
    initialState,
  );

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="locale" value={locale} />
      <textarea
        name="question"
        required
        minLength={5}
        maxLength={2_000}
        rows={4}
        placeholder={pick(
          locale,
          "Example: Which ICT tenders in Riyadh are closing this week?",
          "مثال: ما منافسات تقنية المعلومات في الرياض التي تغلق هذا الأسبوع؟",
        )}
        className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 leading-7 outline-none focus:border-[var(--accent)]"
      />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-2xl text-xs leading-5 text-[var(--muted)]">
          {pick(
            locale,
            "One paid request retrieves at most 20 database tenders. Answers must cite retrieved records or explicitly say the data is insufficient.",
            "يسترجع طلب مدفوع واحد 20 منافسة كحد أقصى من قاعدة البيانات. يجب أن تستشهد الإجابات بالسجلات المسترجعة أو توضح أن البيانات غير كافية.",
          )}
        </p>
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
        >
          {pending
            ? pick(locale, "Searching and answering...", "جارٍ البحث والإجابة...")
            : pick(locale, "Ask tender database", "اسأل قاعدة بيانات المنافسات")}
        </button>
      </div>
      {state.message && (
        <p
          aria-live="polite"
          className={`text-sm ${
            state.status === "error" ? "text-red-700" : "text-[var(--muted)]"
          }`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
