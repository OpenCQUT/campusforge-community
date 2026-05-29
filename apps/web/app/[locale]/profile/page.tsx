"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getApplicationByEmail, type StoredApplication } from "@/lib/application-store";

const MOCK_DB: Record<string, StoredApplication> = {
  "student@school.edu": {
    id: "demo-001", name: "student", email: "student@school.edu",
    studentId: "2024001", department: "Computer Science", reason: "",
    status: "UNDER_REVIEW", submittedAt: "2025-05-20", reviewNote: "",
  },
  "liming@school.edu": {
    id: "demo-002", name: "Li Ming", email: "liming@school.edu",
    studentId: "2024002", department: "Electrical Engineering", reason: "",
    status: "APPROVED", submittedAt: "2025-05-18", reviewNote: "Welcome!",
  },
};

const ACCOUNTS: Record<string, { name: string; role: string }> = {
  "test@admin.edu": { name: "Admin", role: "admin" },
};

function getSessionEmail(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/cf_email=([^;]+)/);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

function getSessionRole(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/cf_session=(\w+)/);
  return match?.[1] ?? null;
}

export default function ProfilePage() {
  const t = useTranslations("profile");
  const ts = useTranslations("statusLabel");

  const email = getSessionEmail() ?? "unknown";
  const role = getSessionRole() ?? "member";
  const account = ACCOUNTS[email];
  const name = account?.name ?? email.split("@")[0];

  // Find application from shared store or mock DB
  const application = getApplicationByEmail(email) ?? MOCK_DB[email] ?? null;

  return (
    <main className="page" style={{ maxWidth: 720, margin: "0 auto" }}>
      <div className="page-header">
        <h1 className="page-title">{name}</h1>
        <p className="page-subtitle">{t("title")}</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Account info card */}
        <div className="glass-card" style={{ padding: 28 }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: 16 }}>
            {t("accountInfo")}
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Row label={t("email")} value={email} />
            <Row label={t("role")} value={
              <span className={`tag ${role === "admin" ? "tag-cyan" : "tag-blue"}`}>
                {role.toUpperCase()}
              </span>
            } />
          </div>
        </div>

        {/* Application status card */}
        <div className="glass-card" style={{ padding: 28 }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: 16 }}>
            {t("myApplication")}
          </h2>
          {application ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Row label={ts(application.status)} value={
                <span className={`status status-${application.status.toLowerCase().replace("_", "-")}`}>
                  {ts(application.status)}
                </span>
              } />
              {application.submittedAt && (
                <Row label="Submitted" value={application.submittedAt} />
              )}
              {application.department && (
                <Row label="Department" value={application.department} />
              )}
              {application.reviewNote && (
                <Row label="Review Note" value={application.reviewNote} />
              )}
              <div style={{ marginTop: 8 }}>
                <Link href="/status" className="btn btn-ghost btn-sm">
                  {t("checkStatus")}
                </Link>
              </div>
            </div>
          ) : (
            <div>
              <p style={{ color: "var(--text-500)", fontSize: "0.9rem", marginBottom: 16 }}>
                {t("noApplication")}
              </p>
              <Link href="/apply" className="btn btn-primary btn-sm">
                {t("applyNow")}
              </Link>
            </div>
          )}
        </div>

        {/* Quick links */}
        <div className="glass-card" style={{ padding: 28 }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: 16 }}>
            {t("quickLinks")}
          </h2>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link href="/resources" className="btn btn-ghost btn-sm">
              {t("viewResources")}
            </Link>
            <Link href="/courses" className="btn btn-ghost btn-sm">
              {t("viewCourses")}
            </Link>
            <Link href="/status" className="btn btn-ghost btn-sm">
              {t("checkStatus")}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ color: "var(--text-500)", fontSize: "0.85rem" }}>{label}</span>
      <span style={{ fontSize: "0.88rem", fontWeight: 500 }}>{value}</span>
    </div>
  );
}
