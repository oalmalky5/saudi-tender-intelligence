import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { saveCompanyProfile } from "./actions";
import { LanguageSwitcher } from "@/app/language-switcher";
import { dateLocale, pick } from "@/lib/i18n/locale";
import { getLocale } from "@/lib/i18n/locale-server";

export const dynamic = "force-dynamic";

type CompanyPageParams = {
  saved?: string | string[];
  error?: string | string[];
};

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function listValue(values: string[] | undefined): string {
  return values?.join("\n") ?? "";
}

function ListField({
  label,
  name,
  values,
  help,
  placeholder,
}: {
  label: string;
  name: string;
  values?: string[];
  help: string;
  placeholder: string;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold">
      {label}
      <textarea
        name={name}
        defaultValue={listValue(values)}
        rows={4}
        placeholder={placeholder}
        className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 font-normal leading-7 outline-none focus:border-[var(--accent)]"
      />
      <span className="text-xs font-normal leading-5 text-[var(--muted)]">
        {help}
      </span>
    </label>
  );
}

export default async function CompanyProfilePage({
  searchParams,
}: {
  searchParams: Promise<CompanyPageParams>;
}) {
  const params = await searchParams;
  const locale = await getLocale();
  const saved = first(params.saved) === "1";
  const error = first(params.error);
  const [profile, opportunityTypes] = await Promise.all([
    prisma.companyProfile.findUnique({ where: { id: "primary" } }),
    prisma.tender.findMany({
      distinct: ["tenderTypeNameArabic"],
      orderBy: { tenderTypeNameArabic: "asc" },
      select: { tenderTypeNameArabic: true },
    }),
  ]);

  return (
    <main className="min-h-screen">
      <header className="border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
          <Link href="/tenders" className="font-semibold hover:text-[var(--accent)]">
            <span className="rtl-flip inline-block">←</span>{" "}
            {pick(locale, "Tender browser", "متصفح المنافسات")}
          </Link>
          <Link
            href="/tenders/recommended"
            className="text-sm font-semibold hover:text-[var(--accent)]"
          >
            {pick(locale, "Recommended tenders", "المنافسات الموصى بها")}
          </Link>
          <LanguageSwitcher locale={locale} />
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
              {pick(locale, "Company profile", "ملف الشركة")}
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
              {pick(locale, "Describe what your company is looking for.", "صف ما تبحث عنه شركتك.")}
            </h1>
            <p className="mt-4 max-w-3xl leading-7 text-[var(--muted)]">
              {pick(locale, "This lightweight profile will power explainable tender matching. Use plain language and non-sensitive information.", "سيشغّل هذا الملف المبسط مطابقة المنافسات القابلة للتفسير. استخدم لغة واضحة ومعلومات غير حساسة.")}
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-white p-5 text-sm leading-6 text-[var(--muted)]">
            {profile ? (
              <>
                <p className="font-semibold text-[var(--foreground)]">
                  {pick(locale, "Profile ready", "الملف جاهز")}
                </p>
                <p className="mt-1">
                  {pick(locale, "Last updated", "آخر تحديث")}{" "}
                  {profile.updatedAt.toLocaleDateString(dateLocale(locale), {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    timeZone: "Asia/Riyadh",
                  })}
                  .
                </p>
              </>
            ) : (
              <>
                <p className="font-semibold text-[var(--foreground)]">
                  {pick(locale, "No profile yet", "لا يوجد ملف بعد")}
                </p>
                <p className="mt-1">
                  {pick(locale, "Complete the required name and summary to create one.", "أكمل الاسم والملخص المطلوبين لإنشاء الملف.")}
                </p>
              </>
            )}
          </div>
        </section>

        {saved && (
          <p className="mt-7 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-800">
            {pick(locale, "Company profile saved successfully.", "تم حفظ ملف الشركة بنجاح.")}
          </p>
        )}
        {error && (
          <p className="mt-7 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
            {pick(locale, "Could not save profile", "تعذر حفظ الملف")}: {error}
          </p>
        )}

        <form action={saveCompanyProfile} className="mt-8 grid gap-6">
          <section className="rounded-3xl border border-[var(--border)] bg-white p-6 sm:p-8">
            <h2 className="text-xl font-semibold">{pick(locale, "Company identity", "هوية الشركة")}</h2>
            <div className="mt-5 grid gap-5">
              <label className="grid gap-1.5 text-sm font-semibold">
                {pick(locale, "Company name", "اسم الشركة")}
                <input
                  name="companyName"
                  required
                  minLength={2}
                  maxLength={160}
                  defaultValue={profile?.companyName ?? ""}
                  placeholder={pick(locale, "Example: Catalyft", "مثال: كاتاليفت")}
                  className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 font-normal outline-none focus:border-[var(--accent)]"
                />
              </label>
              <label className="grid gap-1.5 text-sm font-semibold">
                {pick(locale, "Plain-language company summary", "ملخص واضح عن الشركة")}
                <textarea
                  name="summary"
                  required
                  minLength={20}
                  maxLength={4000}
                  defaultValue={profile?.summary ?? ""}
                  rows={6}
                  placeholder={pick(locale, "Explain what the company does, who it serves, and the kinds of work it wants to pursue.", "اشرح ما تقوم به الشركة، ومن تخدم، وأنواع الأعمال التي ترغب في متابعتها.")}
                  className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 font-normal leading-7 outline-none focus:border-[var(--accent)]"
                />
                <span className="text-xs font-normal leading-5 text-[var(--muted)]">
                  {pick(locale, "This is the most important matching input. Write it as though you were explaining the company to a colleague.", "هذا أهم مدخل للمطابقة. اكتبه كما لو كنت تشرح الشركة لزميل.")}
                </span>
              </label>
            </div>
          </section>

          <section className="rounded-3xl border border-[var(--border)] bg-white p-6 sm:p-8">
            <h2 className="text-xl font-semibold">{pick(locale, "Capabilities and markets", "القدرات والأسواق")}</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {pick(locale, "Enter one item per line or separate items with commas.", "أدخل عنصراً واحداً في كل سطر أو افصل العناصر بفواصل.")}
            </p>
            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              <ListField
                label={pick(locale, "Services offered", "الخدمات المقدمة")}
                name="services"
                values={profile?.services}
                placeholder={"Strategy consulting\nDigital transformation\nTraining"}
                help={pick(locale, "Specific things the company can deliver.", "الأعمال المحددة التي تستطيع الشركة تقديمها.")}
              />
              <ListField
                label={pick(locale, "Activities", "الأنشطة")}
                name="activities"
                values={profile?.activities}
                placeholder={"Management consulting\nInformation technology"}
                help={pick(locale, "Broad activity categories relevant to tenders.", "فئات الأنشطة العامة المرتبطة بالمنافسات.")}
              />
              <ListField
                label={pick(locale, "Industries served", "القطاعات المخدومة")}
                name="industries"
                values={profile?.industries}
                placeholder={"Government\nFinancial services\nHealthcare"}
                help={pick(locale, "Sectors where the company has experience or interest.", "القطاعات التي لدى الشركة خبرة أو اهتمام بها.")}
              />
              <ListField
                label={pick(locale, "Target government entities", "الجهات الحكومية المستهدفة")}
                name="targetGovernmentEntities"
                values={profile?.targetGovernmentEntities}
                placeholder={"Ministry of Communications\nDigital Government Authority"}
                help={pick(locale, "Entities the company especially wants to work with.", "الجهات التي ترغب الشركة بشكل خاص في العمل معها.")}
              />
              <ListField
                label={pick(locale, "Preferred regions", "المناطق المفضلة")}
                name="regions"
                values={profile?.regions}
                placeholder={"Riyadh\nMakkah"}
                help={pick(locale, "Leave empty when location should not affect matching.", "اتركه فارغاً إذا كان الموقع لا ينبغي أن يؤثر على المطابقة.")}
              />
              <ListField
                label={pick(locale, "Preferred keywords", "الكلمات المفتاحية المفضلة")}
                name="preferredKeywords"
                values={profile?.preferredKeywords}
                placeholder={"innovation\nventure building\nstrategy"}
                help={pick(locale, "Words that should increase tender relevance.", "كلمات ينبغي أن تزيد من صلة المنافسة.")}
              />
              <ListField
                label={pick(locale, "Excluded keywords", "الكلمات المستبعدة")}
                name="excludedKeywords"
                values={profile?.excludedKeywords}
                placeholder={"construction\nmedical supplies"}
                help={pick(locale, "Words that indicate a tender is probably unsuitable.", "كلمات تشير إلى أن المنافسة غالباً غير مناسبة.")}
              />
            </div>
          </section>

          <section className="rounded-3xl border border-[var(--border)] bg-white p-6 sm:p-8">
            <h2 className="text-xl font-semibold">{pick(locale, "Preferred opportunity types", "أنواع الفرص المفضلة")}</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {pick(locale, "These options come from tender types currently stored in the database. Leave all unchecked when every type is acceptable.", "تأتي هذه الخيارات من أنواع المنافسات المخزنة حالياً. اتركها دون تحديد إذا كانت كل الأنواع مقبولة.")}
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {opportunityTypes.map(({ tenderTypeNameArabic }) => (
                <label
                  key={tenderTypeNameArabic}
                  dir="rtl"
                  lang="ar"
                  className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-right text-sm"
                >
                  <span>{tenderTypeNameArabic}</span>
                  <input
                    type="checkbox"
                    name="preferredOpportunityTypes"
                    value={tenderTypeNameArabic}
                    defaultChecked={profile?.preferredOpportunityTypes.includes(
                      tenderTypeNameArabic,
                    )}
                    className="h-4 w-4 accent-[var(--accent)]"
                  />
                </label>
              ))}
            </div>
          </section>

          <div className="flex items-center justify-end">
            <button
              type="submit"
              className="rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white hover:opacity-90"
            >
              {profile
                ? pick(locale, "Update company profile", "تحديث ملف الشركة")
                : pick(locale, "Create company profile", "إنشاء ملف الشركة")}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
