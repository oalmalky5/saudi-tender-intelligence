import Link from "next/link";

import { LanguageSwitcher } from "@/app/language-switcher";
import { dateLocale, pick, type Locale } from "@/lib/i18n/locale";
import { getLocale } from "@/lib/i18n/locale-server";
import { prisma } from "@/lib/prisma";
import { requireWorkspace } from "@/lib/auth/session";

import {
  markAllNotificationsRead,
  markNotificationRead,
  runMonitoringNow,
  saveNotificationSettings,
} from "./actions";
import { RunMonitoringButton } from "./run-monitoring-button";

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
  const { workspace } = await requireWorkspace();
  const profileId = workspace.companyProfile?.id ?? "";
  const locale = await getLocale();
  const runId = first(params.run);
  const saved = first(params.saved) === "1";
  const error = first(params.error);
  const [profile, notifications, recentRuns, unreadCount] = await Promise.all([
    prisma.companyProfile.findUnique({ where: { workspaceId: workspace.id } }),
    prisma.notification.findMany({
      where: { companyProfileId: profileId },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        tender: {
          select: { id: true, referenceNumber: true, titleArabic: true },
        },
      },
    }),
    prisma.monitoringRun.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { startedAt: "desc" },
      take: 10,
    }),
    prisma.notification.count({
      where: { companyProfileId: profileId, readAt: null },
    }),
  ]);
  const selectedRun = runId
    ? recentRuns.find((run) => run.id === runId) ??
      (await prisma.monitoringRun.findFirst({
        where: { id: runId, workspaceId: workspace.id },
      }))
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
              {pick(locale, "Monitoring checks the latest Etimad tenders against your company profile, then alerts you when a relevant opportunity appears, changes, or approaches its deadline.", "تتحقق المراقبة من أحدث منافسات اعتماد وتقارنها بملف شركتك، ثم تنبهك عند ظهور فرصة مناسبة أو تغيرها أو اقتراب موعدها النهائي.")}
            </p>
          </div>
          <form action={runMonitoringNow}>
            <RunMonitoringButton locale={locale} />
          </form>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            pick(locale, "1. Check the latest tenders", "١. التحقق من أحدث المنافسات"),
            pick(locale, "2. Compare them with your profile", "٢. مقارنتها بملف شركتك"),
            pick(locale, "3. Notify you about useful changes", "٣. تنبيهك بالتغييرات المهمة"),
          ].map((title, index) => (
            <article key={title} className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-soft)]">
              <p className="font-semibold text-[var(--accent-deep)]">{title}</p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                {[
                  pick(locale, "Imports newly published and updated public tender records from Etimad.", "يستورد سجلات المنافسات العامة المنشورة حديثاً والمحدثة من اعتماد."),
                  pick(locale, "Uses your services, sectors, target entities, and notification threshold to find direct scope matches.", "يستخدم خدماتك وقطاعاتك والجهات المستهدفة وحد التنبيه للعثور على مطابقات مباشرة للنطاق."),
                  pick(locale, "Creates alerts for new matches, updated matches, and approaching submission deadlines.", "ينشئ تنبيهات للمطابقات الجديدة والمحدثة ومواعيد التقديم القريبة."),
                ][index]}
              </p>
            </article>
          ))}
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
            <p className="font-semibold">
              {pick(locale, "Latest check", "آخر تحقق")}: {selectedRun.status.replaceAll("_", " ")}
            </p>
            <p className="mt-1">
              {selectedRun.recordsFetched} {pick(locale, "tenders checked", "منافسة تم التحقق منها")} ·{" "}
              {selectedRun.newTenderCount} {pick(locale, "new", "جديدة")} ·{" "}
              {selectedRun.changedTenderCount} {pick(locale, "changed", "متغيرة")} ·{" "}
              {selectedRun.notificationCount} {pick(locale, "notifications created", "تنبيهات تم إنشاؤها")}
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
              <div className="rounded-3xl border border-dashed border-[var(--border-strong)] bg-white p-6 sm:p-8">
                <p className="font-semibold">{pick(locale, "No notifications yet", "لا توجد تنبيهات بعد")}</p>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  {pick(locale, "Run monitoring to check current Etimad tenders. When a relevant opportunity is found, notifications will look like this:", "شغّل المراقبة للتحقق من منافسات اعتماد الحالية. عند العثور على فرصة مناسبة، ستظهر التنبيهات بهذا الشكل:")}
                </p>
                <article className="mt-5 rounded-2xl border border-[var(--accent)] bg-[var(--accent-soft)] p-5 opacity-80">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--accent)]">
                    {pick(locale, "Example · New match", "مثال · مطابقة جديدة")}
                  </p>
                  <h3 className="mt-2 font-semibold">
                    {pick(locale, "A newly published tender matches your company services", "منافسة منشورة حديثاً تطابق خدمات شركتك")}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                    {pick(locale, "You would see the relevance score, reasons for the match, deadline, and a link to review the tender.", "سترى درجة الصلة وأسباب المطابقة والموعد النهائي ورابطاً لمراجعة المنافسة.")}
                  </p>
                </article>
              </div>
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
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
            {pick(
              locale,
              "This operational history confirms when the platform last checked Etimad, how many records changed, and whether notifications were created. It helps you know the tender feed is current.",
              "يوضح هذا السجل متى تحققت المنصة آخر مرة من اعتماد، وعدد السجلات المتغيرة، وما إذا تم إنشاء تنبيهات، لتتأكد من أن بيانات المنافسات محدثة.",
            )}
          </p>
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
