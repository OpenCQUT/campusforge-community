"use client";

import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";

export default function LoginPage() {
  const t = useTranslations("login");
  const tc = useTranslations("common");
  const router = useRouter();

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    // Demo: set a session cookie and redirect to resources
    document.cookie = "cf_session=demo; path=/; max-age=86400";
    router.push("/resources");
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

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div className="field">
              <label htmlFor="email">{t("emailLabel")}</label>
              <input
                id="email"
                type="email"
                placeholder={t("emailPlaceholder")}
              />
            </div>
            <div className="field">
              <label htmlFor="password">{t("passwordLabel")}</label>
              <input id="password" type="password" placeholder="••••••••" />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>
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
