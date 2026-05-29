"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";

export default function LoginPage() {
  const t = useTranslations("login");
  const tc = useTranslations("common");
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    const response = await fetch("/api/session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      setError(t("invalidCredentials"));
      return;
    }

    router.push("/admin");
  }

  return (
    <main className="page auth-page">
      <section className="auth-hero" aria-labelledby="login-title">
        <div className="auth-copy">
          <div className="auth-kicker">{t("applyLink")}</div>
          <h1 id="login-title" className="auth-title">
            {t("title")}
          </h1>
          <p className="auth-lede">{t("subtitle")}</p>
          <div className="auth-proof-grid" aria-label={t("title")}>
            <span>{tc("browseResources")}</span>
            <span>{t("checkStatus")}</span>
            <span>{tc("requestInvitation")}</span>
          </div>
        </div>

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
      </section>
    </main>
  );
}
