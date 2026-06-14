import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

import { SignInForm } from "./sign-in-form";

export const dynamic = "force-dynamic";

type SignInParams = { next?: string | string[] };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<SignInParams>;
}) {
  if (await getSession()) {
    redirect("/tenders");
  }
  const rawNext = (await searchParams).next;
  const next = Array.isArray(rawNext) ? rawNext[0] ?? "/tenders" : rawNext ?? "/tenders";

  return (
    <main className="auth-page">
      <div className="auth-glow" />
      <section className="auth-card">
        <div className="brand-mark auth-brand" aria-label="Tender Intelligence">
          <span className="brand-orbit"><span /></span>
          <span className="brand-copy">
            <strong>Tender</strong>
            <small>Intelligence</small>
          </span>
        </div>
        <p className="auth-eyebrow">Portfolio demo workspace</p>
        <h1>Find the opportunities that actually fit.</h1>
        <p className="auth-intro">
          Sign in to access the private Catalyft profile, decisions, AI matches,
          notifications, reports, and document analysis.
        </p>
        <div className="auth-form-panel">
          <div className="auth-form-heading">
            <h2>Sign in</h2>
            <p>Use the demo credentials below to explore the private workspace.</p>
          </div>
          <SignInForm next={next} />
          <div className="auth-demo-credentials">
            <span>Demo credentials</span>
            <dl>
              <div><dt>Email</dt><dd>demo@etimad.local</dd></div>
              <div><dt>Password</dt><dd>demo12345</dd></div>
            </dl>
          </div>
        </div>
      </section>
    </main>
  );
}
