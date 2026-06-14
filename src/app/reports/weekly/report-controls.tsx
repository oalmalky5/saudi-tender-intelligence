"use client";

import { useActionState } from "react";

import { pick, type Locale } from "@/lib/i18n/locale";

import {
  generateWeeklyReportAction,
  type WeeklyReportActionState,
} from "./actions";

const initialState: WeeklyReportActionState = {
  status: "idle",
  message: "",
};

export function WeeklyReportControls({
  locale,
  defaultFrom,
  defaultTo,
}: {
  locale: Locale;
  defaultFrom: string;
  defaultTo: string;
}) {
  const [state, formAction, pending] = useActionState(
    generateWeeklyReportAction,
    initialState,
  );

  return (
    <form action={formAction} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-semibold">
          {pick(locale, "Report start date", "تاريخ بداية التقرير")}
          <input
            type="date"
            name="dateFrom"
            required
            defaultValue={defaultFrom}
            className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 font-normal"
          />
        </label>
        <label className="grid gap-1.5 text-sm font-semibold">
          {pick(locale, "Report end date", "تاريخ نهاية التقرير")}
          <input
            type="date"
            name="dateTo"
            required
            defaultValue={defaultTo}
            className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 font-normal"
          />
        </label>
      </div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-2xl text-xs leading-5 text-[var(--muted)]">
          {pick(
            locale,
            "One paid request reviews at most 20 curated database tenders. The output is validated, stored, and rendered into trustworthy Markdown with local tender links.",
            "يراجع طلب مدفوع واحد 20 منافسة مختارة كحد أقصى. يتم التحقق من المخرجات وتخزينها وتحويلها إلى Markdown موثوق مع روابط محلية للمنافسات.",
          )}
        </p>
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-60"
        >
          {pending
            ? pick(locale, "Generating report...", "جارٍ إنشاء التقرير...")
            : pick(locale, "Generate Weekly Tender Report", "إنشاء تقرير المنافسات الأسبوعي")}
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
