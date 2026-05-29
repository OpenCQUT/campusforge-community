"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { config } from "@/lib/config";

function getAccounts(): Record<string, { password: string; role: string }> {
  const accounts: Record<string, { password: string; role: string }> = {};
  if (config.admin.email && config.admin.password) {
    accounts[config.admin.email.toLowerCase()] = { password: config.admin.password, role: "admin" };
  }
  return accounts;
}

export default function LoginPage() {
  const t = useTranslations("login");
  const tc = useTranslations("common");
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const account = getAccounts()[email.trim().toLowerCase()];
    if (!account || account.password !== password) {
      setError(t("invalidCredentials"));
      return;
    }

    document.cookie = `cf_session=${account.role}; path=/; max-age=86400`;
    document.cookie = `cf_email=${encodeURIComponent(email.trim().toLowerCase())}; path=/; max-age=86400`;
    router.push(account.role === "admin" ? "/admin" : "/resources");
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
