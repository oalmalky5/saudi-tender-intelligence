"use client";

import { useActionState } from "react";

import { signInAction, type SignInState } from "./actions";

const initialState: SignInState = { error: null };

export function SignInForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(signInAction, initialState);

  return (
    <form action={action} className="auth-form">
      <input type="hidden" name="next" value={next} />
      <label className="auth-field">
        <span className="auth-field-label">Email address</span>
        <input
          name="email"
          type="email"
          defaultValue="demo@etimad.local"
          placeholder="you@company.com"
          autoComplete="email"
          required
        />
      </label>
      <label className="auth-field">
        <span className="auth-field-label">Password</span>
        <input
          name="password"
          type="password"
          placeholder="Enter your password"
          autoComplete="current-password"
          required
        />
      </label>
      {state.error && <p className="auth-error">{state.error}</p>}
      <button type="submit" disabled={pending}>
        {pending ? "Signing in..." : "Sign in to workspace"}
      </button>
    </form>
  );
}
