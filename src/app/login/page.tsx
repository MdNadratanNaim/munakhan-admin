"use client";

import { FormEvent, useState } from "react";
import { Icon } from "@/components/ui/Icon";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error || "Unable to sign in.");
        return;
      }
      const next = new URL(window.location.href).searchParams.get("next");
      window.location.assign(next?.startsWith("/") ? next : "/");
    } catch {
      setError("The login request failed. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-panel" aria-labelledby="login-title">
        <div className="auth-card">
          <div className="brand brand-large">
            <span className="brand-mark">
              <Icon name="pencil" size={18} />
            </span>
            <span className="brand-text">Website editor</span>
          </div>
          <h1 id="login-title">Sign in</h1>
          <form onSubmit={submit} className="auth-form">
            <label htmlFor="admin-password">Password</label>
            <div className="password-field">
              <input
                id="admin-password"
                type={show ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                autoFocus
                required
                aria-describedby={error ? "login-error" : undefined}
                aria-invalid={error ? true : undefined}
              />
              <button type="button" className="icon-btn password-toggle" onClick={() => setShow((v) => !v)} aria-pressed={show} aria-label={show ? "Hide password" : "Show password"} title={show ? "Hide password" : "Show password"}>
                <Icon name="eye" size={18} />
              </button>
            </div>
            {error && (
              <p className="auth-error" role="alert" id="login-error">
                <Icon name="alert" size={16} />
                <span>{error}</span>
              </p>
            )}
            <button type="submit" className="btn btn-primary btn-large" disabled={busy || !password}>
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
