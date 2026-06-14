import Link from "next/link";

import { LanguageSwitcher } from "@/app/language-switcher";
import { dateLocale, pick, type Locale } from "@/lib/i18n/locale";
import { getLocale } from "@/lib/i18n/locale-server";
import { prisma } from "@/lib/prisma";

import {
  markAllNotificationsRead,
  markNotificationRead,
  runMonitoringNow,
  saveNotificationSettings,
} from "./actions";

export const dynamic = "force-dynamic";

type PageParams = {
  run?: string | string[];
  saved?: string | string[];
  error?: string | string[];
};

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function formatDate(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(dateLocale(locale), {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Riyadh",
  }).format(date);
}

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<PageParams>;
}) {
  const params = await searchParams;
  const locale = await getLocale();
  const runId = first(params.run);
  const saved = first(params.saved) === "1";
  const error = first(params.error);
  const [profile, notifications, recentRuns, unreadCount] = await Promise.all([
    prisma.companyProfile.findUnique({ where: { id: "primary" } }),
    prisma.notification.findMany({
      where: { companyProfileId: "primary" },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        tender: {
          select: { id: true, referenceNumber: true, titleArabic: true },
        },
      },
    }),
    prisma.monitoringRun.findMany({
      orderBy: { startedAt: "desc" },
      take: 10,
    }),
    prisma.notification.count({
      where: { companyProfileId: "primary", readAt: null },
    }),
  ]);
  const selectedRun = runId
    ? recentRuns.find((run) => run.id === runId) ??
      (await prisma.monitoringRun.findUnique({ where: { id: runId } }))
    : null;

  return (
    <main className="min-h-screen">
      <header className="border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
          <Link href="/tenders" className="font-semibold hover:text-[var(--accent)]">
            <span className="rtl-flip inline-block">←</span>{" "}
            {pick(locale, "Tender browser", "متصفح المنافسات")}
          </Link>
          <LanguageSwitcher locale={locale} />
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <section className="grid gap-6 border-b border-[var(--border)] pb-9 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
              {pick(locale, "Monitoring and notifications", "المراقبة والتنبيهات")}
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
              {pick(locale, "Relevant opportunities, surfaced automatically.", "فرص مناسبة تظهر تلقائياً.")}
            </h1>
            <p className="mt-4 max-w-3xl leading-7 text-[var(--muted)]">
              {pick(locale, "Monitoring detects new and changed public tenders, enriches a bounded set, and creates explainable notifications without paid AI calls.", "تكتشف المراقبة المنافسات العامة الجديدة والمتغيرة، وتثري مجموعة محدودة، وتنشئ تنبيهات قابلة للتفسير دون استدعاءات ذكاء اصطناعي مدفوعة.")}
            </p>
          </div>
          <form action={runMonitoringNow}>
            <button
              type="submit"
              className="rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white"
            >
              {pick(locale, "Run monitoring now", "تشغيل المراقبة الآن")}
            </button>
          </form>
        </section>

        {error && (
          <p className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </p>
        )}
        {saved && (
          <p className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-800">
            {pick(locale, "Notification settings saved.", "تم حفظ إعدادات التنبيهات.")}
          </p>
        )}
        {selectedRun && (
          <section className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-5 text-sm text-green-900">
            <p className="font-semibold">Monitoring run: {selectedRun.status}</p>
            <p className="mt-1">
              {selectedRun.recordsFetched} fetched · {selectedRun.newTenderCount} new ·{" "}
              {selectedRun.changedTenderCount} changed · {selectedRun.enrichedCount} enriched ·{" "}
              {selectedRun.notificationCount} notifications
            </p>
          </section>
        )}

        {!profile ? (
          <section className="mt-8 rounded-3xl border border-dashed border-[var(--border-strong)] bg-white px-6 py-16 text-center">
            <h2 className="text-xl font-semibold">{pick(locale, "Create a company profile first", "أنشئ ملف الشركة أولاً")}</h2>
            <p className="mt-2 text-[var(--muted)]">
              {pick(locale, "The monitoring job can import tenders, but relevance notifications require a company profile.", "يمكن لمهمة المراقبة استيراد المنافسات، لكن تنبيهات الصلة تحتاج إلى ملف شركة.")}
            </p>
            <Link href="/company" className="mt-5 inline-flex rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white">
              {pick(locale, "Create profile", "إنشاء ملف")}
            </Link>
          </section>
        ) : (
          <section className="mt-8 rounded-3xl border border-[var(--border)] bg-white p-6 sm:p-8">
            <h2 className="text-xl font-semibold">{pick(locale, "Notification settings", "إعدادات التنبيهات")}</h2>
            <form action={saveNotificationSettings} className="mt-5 grid gap-5 sm:grid-cols-3">
              <label className="grid gap-1.5 text-sm font-semibold">
                {pick(locale, "Minimum relevance score", "الحد الأدنى لدرجة الصلة")}
                <input type="number" name="notificationRelevanceThreshold" min="1" max="100" defaultValue={profile.notificationRelevanceThreshold} className="rounded-xl border border-[var(--border)] px-4 py-3 font-normal" />
              </label>
              <label className="grid gap-1.5 text-sm font-semibold">
                {pick(locale, "Deadline reminder days", "أيام تذكير الموعد النهائي")}
                <input type="number" name="deadlineReminderDays" min="1" max="30" defaultValue={profile.deadlineReminderDays} className="rounded-xl border border-[var(--border)] px-4 py-3 font-normal" />
              </label>
              <label className="grid gap-1.5 text-sm font-semibold">
                {pick(locale, "Digest frequency", "تكرار الملخص")}
                <select name="digestFrequency" defaultValue={profile.digestFrequency} className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 font-normal">
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="NONE">None</option>
                </select>
              </label>
              <div className="sm:col-span-3">
                <button type="submit" className="rounded-xl bg-[var(--foreground)] px-5 py-2.5 text-sm font-semibold text-white">
                  {pick(locale, "Save settings", "حفظ الإعدادات")}
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold">
              {pick(locale, "Notification center", "مركز التنبيهات")} ({unreadCount})
            </h2>
            {unreadCount > 0 && (
              <form action={markAllNotificationsRead}>
                <button type="submit" className="text-sm font-semibold text-[var(--accent)] hover:underline">
                  {pick(locale, "Mark all read", "تحديد الكل كمقروء")}
                </button>
              </form>
            )}
          </div>
          <div className="mt-5 grid gap-4">
            {notifications.length === 0 ? (
              <p className="rounded-3xl border border-dashed border-[var(--border-strong)] bg-white px-6 py-14 text-center text-[var(--muted)]">
                {pick(locale, "No notifications yet. Run monitoring to check current Etimad tenders.", "لا توجد تنبيهات بعد. شغّل المراقبة للتحقق من منافسات اعتماد الحالية.")}
              </p>
            ) : notifications.map((notification) => (
              <article key={notification.id} className={`rounded-3xl border p-5 sm:p-6 ${notification.readAt ? "border-[var(--border)] bg-white" : "border-[var(--accent)] bg-[var(--accent-soft)]"}`}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--accent)]">{notification.type.replaceAll("_", " ")}</p>
                    <h3 className="mt-2 text-lg font-semibold">{notification.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{notification.body}</p>
                    {notification.reasons.length > 0 && (
                      <ul className="mt-3 grid gap-1 text-sm">
                        {notification.reasons.map((reason) => <li key={reason}>+ {reason}</li>)}
                      </ul>
                    )}
                    <div className="mt-4 flex flex-wrap gap-4 text-sm font-semibold">
                      {notification.tender && (
                        <Link href={`/tenders/${notification.tender.id}`} className="text-[var(--accent)] hover:underline">
                          {pick(locale, "View tender", "عرض المنافسة")} {notification.tender.referenceNumber}
                        </Link>
                      )}
                      <span className="font-normal text-[var(--muted)]">{formatDate(notification.createdAt, locale)}</span>
                    </div>
                  </div>
                  {!notification.readAt && (
                    <form action={markNotificationRead}>
                      <input type="hidden" name="notificationId" value={notification.id} />
                      <button type="submit" className="rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-xs font-semibold">
                        {pick(locale, "Mark read", "تحديد كمقروء")}
                      </button>
                    </form>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <h2 className="font-semibold">{pick(locale, "Recent monitoring runs", "عمليات المراقبة الأخيرة")}</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="border-b border-[var(--border)] text-xs uppercase text-[var(--muted)]">
                <tr><th className="py-3">Started</th><th>Status</th><th>Fetched</th><th>New</th><th>Changed</th><th>Notifications</th></tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {recentRuns.map((run) => (
                  <tr key={run.id}>
                    <td className="py-3">{formatDate(run.startedAt, locale)}</td>
                    <td>{run.status}</td><td>{run.recordsFetched}</td><td>{run.newTenderCount}</td><td>{run.changedTenderCount}</td><td>{run.notificationCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
