"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

function getSessionRole(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/cf_role=(\w+)/);
  return match?.[1] ?? null;
}

export default function LoginPage() {
  const t = useTranslations("login");
  const tc = useTranslations("common");
  const locale = useLocale();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    const role = getSessionRole();
    if (role === "admin") {
      window.location.replace(`/${locale}/admin`);
    }
  }, [locale]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const submittedEmail = String(formData.get("email") ?? email);
    const submittedPassword = String(formData.get("password") ?? password);
    setError("");
    setIsSubmitting(true);

    const response = await fetch("/api/session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: submittedEmail, password: submittedPassword }),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      setError(t("invalidCredentials"));
      return;
    }

    window.dispatchEvent(new Event("campusforge-session-change"));
    window.location.assign(`/${locale}/admin`);
  }

  return (
    <main className="page auth-page">
      <section
        className={`auth-hero ${showLogin ? "auth-hero-login" : "auth-hero-landing"}`}
        aria-labelledby="login-title"
      >
        <div className="auth-copy">
          <h1 id="login-title" className="auth-title">
            {t("title")}
          </h1>
          {!showLogin && (
            <div className="auth-actions" aria-label={t("title")}>
              <button
                type="button"
                className="btn btn-primary auth-action"
                onClick={() => setShowLogin(true)}
              >
                {tc("login")}
              </button>
              <Link href="/apply" className="btn btn-ghost auth-action">
                {tc("requestInvitation")}
              </Link>
            </div>
          )}
        </div>

        {showLogin && (
          <div className="glass-card auth-card">
            <div className="auth-card-heading">
              <span className="auth-card-icon" aria-hidden="true" />
              <div>
                <h2>{tc("login")}</h2>
                <p>{t("subtitle")}</p>
              </div>
            </div>

            <form
              onSubmit={handleLogin}
              style={{ display: "flex", flexDirection: "column", gap: 20 }}
            >
              <div className="field">
                <label htmlFor="email">{t("emailLabel")}</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder={t("emailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="password">{t("passwordLabel")}</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && (
                <p style={{ color: "var(--danger)", fontSize: "0.85rem", margin: 0 }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting}
                style={{ width: "100%" }}
              >
                {tc("login")}
              </button>
            </form>

            <div
              style={{
                marginTop: 28,
                textAlign: "center",
                fontSize: "0.85rem",
                color: "var(--text-500)",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <span>
                {t("noAccount")}{" "}
                <Link href="/apply" style={{ color: "var(--cyan)" }}>
                  {t("applyLink")}
                </Link>
              </span>
              <span>
                {t("checkStatus")}{" "}
                <Link href="/status" style={{ color: "var(--cyan)" }}>
                  {t("statusLink")}
                </Link>
              </span>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
