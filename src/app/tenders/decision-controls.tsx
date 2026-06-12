import { updateTenderDecision } from "./actions";
import { pick, type Locale } from "@/lib/i18n/locale";

export function DecisionControls({
  tenderId,
  status,
  compact = false,
  locale = "en",
}: {
  tenderId: string;
  status: "SAVED" | "IGNORED" | null;
  compact?: boolean;
  locale?: Locale;
}) {
  const buttonClass = compact
    ? "rounded-lg border px-3 py-1.5 text-xs font-semibold"
    : "rounded-xl border px-4 py-2.5 text-sm font-semibold";

  return (
    <div className="flex flex-wrap gap-2">
      <form action={updateTenderDecision}>
        <input type="hidden" name="tenderId" value={tenderId} />
        <input type="hidden" name="status" value="SAVED" />
        <button
          type="submit"
          className={`${buttonClass} ${
            status === "SAVED"
              ? "border-[var(--accent)] bg-[var(--accent)] text-white"
              : "border-[var(--border)] bg-white hover:border-[var(--accent)]"
          }`}
        >
          {status === "SAVED"
            ? pick(locale, "Saved", "محفوظة")
            : pick(locale, "Save", "حفظ")}
        </button>
      </form>
      <form action={updateTenderDecision}>
        <input type="hidden" name="tenderId" value={tenderId} />
        <input type="hidden" name="status" value="IGNORED" />
        <button
          type="submit"
          className={`${buttonClass} ${
            status === "IGNORED"
              ? "border-[var(--muted)] bg-[var(--muted)] text-white"
              : "border-[var(--border)] bg-white hover:border-[var(--muted)]"
          }`}
        >
          {status === "IGNORED"
            ? pick(locale, "Ignored", "مستبعدة")
            : pick(locale, "Ignore", "استبعاد")}
        </button>
      </form>
      {status && (
        <form action={updateTenderDecision}>
          <input type="hidden" name="tenderId" value={tenderId} />
          <input type="hidden" name="status" value="CLEAR" />
          <button
            type="submit"
            className={`${buttonClass} border-transparent text-[var(--muted)] hover:text-[var(--foreground)]`}
          >
            {pick(locale, "Undo", "تراجع")}
          </button>
        </form>
      )}
    </div>
  );
}
