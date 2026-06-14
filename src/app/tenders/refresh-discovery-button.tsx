"use client";

import { useFormStatus } from "react-dom";

import { pick, type Locale } from "@/lib/i18n/locale";

export function RefreshDiscoveryButton({ locale }: { locale: Locale }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl bg-[var(--foreground)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--accent-deep)] disabled:cursor-wait disabled:opacity-60"
    >
      {pending
        ? pick(locale, "Checking Etimad...", "جارٍ التحقق من اعتماد...")
        : pick(locale, "Refresh from Etimad", "تحديث من اعتماد")}
    </button>
  );
}
