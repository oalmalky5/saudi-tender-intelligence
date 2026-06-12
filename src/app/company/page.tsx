import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { saveCompanyProfile } from "./actions";

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
            ← Tender browser
          </Link>
          <Link
            href="/tenders/saved"
            className="text-sm font-semibold hover:text-[var(--accent)]"
          >
            Saved workspace
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
              Company profile
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
              Describe what your company is looking for.
            </h1>
            <p className="mt-4 max-w-3xl leading-7 text-[var(--muted)]">
              This lightweight profile will power explainable tender matching.
              Use plain language and non-sensitive information.
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-white p-5 text-sm leading-6 text-[var(--muted)]">
            {profile ? (
              <>
                <p className="font-semibold text-[var(--foreground)]">
                  Profile ready
                </p>
                <p className="mt-1">
                  Last updated{" "}
                  {profile.updatedAt.toLocaleDateString("en-GB", {
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
                  No profile yet
                </p>
                <p className="mt-1">
                  Complete the required name and summary to create one.
                </p>
              </>
            )}
          </div>
        </section>

        {saved && (
          <p className="mt-7 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-800">
            Company profile saved successfully.
          </p>
        )}
        {error && (
          <p className="mt-7 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
            Could not save profile: {error}
          </p>
        )}

        <form action={saveCompanyProfile} className="mt-8 grid gap-6">
          <section className="rounded-3xl border border-[var(--border)] bg-white p-6 sm:p-8">
            <h2 className="text-xl font-semibold">Company identity</h2>
            <div className="mt-5 grid gap-5">
              <label className="grid gap-1.5 text-sm font-semibold">
                Company name
                <input
                  name="companyName"
                  required
                  minLength={2}
                  maxLength={160}
                  defaultValue={profile?.companyName ?? ""}
                  placeholder="Example: Catalyft"
                  className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 font-normal outline-none focus:border-[var(--accent)]"
                />
              </label>
              <label className="grid gap-1.5 text-sm font-semibold">
                Plain-language company summary
                <textarea
                  name="summary"
                  required
                  minLength={20}
                  maxLength={4000}
                  defaultValue={profile?.summary ?? ""}
                  rows={6}
                  placeholder="Explain what the company does, who it serves, and the kinds of work it wants to pursue."
                  className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 font-normal leading-7 outline-none focus:border-[var(--accent)]"
                />
                <span className="text-xs font-normal leading-5 text-[var(--muted)]">
                  This is the most important matching input. Write it as though
                  you were explaining the company to a colleague.
                </span>
              </label>
            </div>
          </section>

          <section className="rounded-3xl border border-[var(--border)] bg-white p-6 sm:p-8">
            <h2 className="text-xl font-semibold">Capabilities and markets</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Enter one item per line or separate items with commas.
            </p>
            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              <ListField
                label="Services offered"
                name="services"
                values={profile?.services}
                placeholder={"Strategy consulting\nDigital transformation\nTraining"}
                help="Specific things the company can deliver."
              />
              <ListField
                label="Activities"
                name="activities"
                values={profile?.activities}
                placeholder={"Management consulting\nInformation technology"}
                help="Broad activity categories relevant to tenders."
              />
              <ListField
                label="Industries served"
                name="industries"
                values={profile?.industries}
                placeholder={"Government\nFinancial services\nHealthcare"}
                help="Sectors where the company has experience or interest."
              />
              <ListField
                label="Target government entities"
                name="targetGovernmentEntities"
                values={profile?.targetGovernmentEntities}
                placeholder={"Ministry of Communications\nDigital Government Authority"}
                help="Entities the company especially wants to work with."
              />
              <ListField
                label="Preferred regions"
                name="regions"
                values={profile?.regions}
                placeholder={"Riyadh\nMakkah"}
                help="Leave empty when location should not affect matching."
              />
              <ListField
                label="Preferred keywords"
                name="preferredKeywords"
                values={profile?.preferredKeywords}
                placeholder={"innovation\nventure building\nstrategy"}
                help="Words that should increase tender relevance."
              />
              <ListField
                label="Excluded keywords"
                name="excludedKeywords"
                values={profile?.excludedKeywords}
                placeholder={"construction\nmedical supplies"}
                help="Words that indicate a tender is probably unsuitable."
              />
            </div>
          </section>

          <section className="rounded-3xl border border-[var(--border)] bg-white p-6 sm:p-8">
            <h2 className="text-xl font-semibold">Preferred opportunity types</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              These options come from tender types currently stored in the
              database. Leave all unchecked when every type is acceptable.
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
              {profile ? "Update company profile" : "Create company profile"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
