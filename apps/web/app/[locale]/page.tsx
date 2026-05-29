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
    <main className="page" style={{ maxWidth: 480, margin: "0 auto" }}>
      <div style={{ padding: "80px 0" }}>
        <div className="glass-card" style={{ padding: 40 }}>
          <h1
            style={{
              fontSize: "1.6rem",
              fontWeight: 700,
              marginBottom: 8,
              textAlign: "center",
            }}
          >
            {t("title")}
          </h1>
          <p
            style={{
              color: "var(--text-500)",
              fontSize: "0.9rem",
              textAlign: "center",
              marginBottom: 32,
            }}
          >
            {t("subtitle")}
          </p>

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
              marginTop: 24,
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
      </div>
    </main>
  );
}
