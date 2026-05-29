"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { getApplicationByEmail } from "@/lib/application-store";

interface Application {
  id: string;
  schoolEmail: string;
  studentId: string;
  department: string;
  status: "SUBMITTED" | "VERIFYING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "NEEDS_INFO";
  submittedAt: string;
}

// Demo data — will be replaced with API call
const MOCK_DB: Record<string, Application> = {
  "student@school.edu": {
    id: "demo-001",
    schoolEmail: "student@school.edu",
    studentId: "2024001",
    department: "Computer Science",
    status: "UNDER_REVIEW",
    submittedAt: "2025-05-20",
  },
  "liming@school.edu": {
    id: "demo-002",
    schoolEmail: "liming@school.edu",
    studentId: "2024002",
    department: "Electrical Engineering",
    status: "APPROVED",
    submittedAt: "2025-05-18",
  },
};

export default function StatusPage() {
  const t = useTranslations("status");
  const ts = useTranslations("statusLabel");

  const [email, setEmail] = useState("");
  const [result, setResult] = useState<Application | null | "not-found">(
    null,
  );

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    // Check shared store first (new submissions), then mock DB
    const stored = getApplicationByEmail(trimmed);
    if (stored) {
      setResult({ ...stored, schoolEmail: stored.email });
      return;
    }
    const found = MOCK_DB[trimmed];
    setResult(found ?? "not-found");
  }

  const steps = [
    { key: "SUBMITTED", label: t("stepSubmitted"), description: t("stepSubmittedDesc") },
    { key: "VERIFYING", label: t("stepVerifying"), description: t("stepVerifyingDesc") },
    { key: "UNDER_REVIEW", label: t("stepReview"), description: t("stepReviewDesc") },
    { key: "APPROVED", label: t("stepDecision"), description: t("stepDecisionDesc") },
  ];

  return (
    <main className="page">
      <div className="page-header">
        <h1 className="page-title">{t("title")}</h1>
        <p className="page-subtitle">{t("subtitle")}</p>
      </div>

      {/* Search form */}
      <form
        onSubmit={handleSearch}
        style={{
          display: "flex",
          gap: 12,
          alignItems: "flex-end",
          maxWidth: 520,
          marginBottom: 32,
        }}
      >
        <div className="field" style={{ flex: 1 }}>
          <label htmlFor="lookup-email">{t("searchLabel")}</label>
          <input
            id="lookup-email"
            type="email"
            placeholder={t("searchPlaceholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary">
          {t("searchButton")}
        </button>
      </form>

      {/* Not found */}
      {result === "not-found" && (
        <div
          className="glass-card"
          style={{
            padding: 24,
            maxWidth: 520,
            borderColor: "rgba(255,95,125,0.3)",
          }}
        >
          <p style={{ color: "var(--danger)", fontSize: "0.9rem" }}>
            {t("notFound")}
          </p>
        </div>
      )}

      {/* Result */}
      {result && result !== "not-found" && (
        <div className="grid-2">
          <div className="glass-card" style={{ padding: 32 }}>
            <h2
              style={{
                fontSize: "1.1rem",
                fontWeight: 700,
                marginBottom: 20,
              }}
            >
              {t("details")}
            </h2>
            <div
              style={{ display: "flex", flexDirection: "column", gap: 14 }}
            >
              <DetailRow label={t("appId")} value={result.id} />
              <DetailRow label={t("schoolEmail")} value={result.schoolEmail} />
              <DetailRow label={t("studentId")} value={result.studentId} />
              <DetailRow label={t("department")} value={result.department} />
              <DetailRow label={t("submitted")} value={result.submittedAt} />
              <DetailRow
                label={t("currentStatus")}
                value={
                  <span
                    className={`status status-${result.status.toLowerCase().replace("_", "-")}`}
                  >
                    {ts(result.status)}
                  </span>
                }
              />
            </div>
          </div>

          <div className="glass-card" style={{ padding: 32 }}>
            <h2
              style={{
                fontSize: "1.1rem",
                fontWeight: 700,
                marginBottom: 20,
              }}
            >
              {t("progress")}
            </h2>
            <div className="status-timeline">
              {steps.map((step, i) => {
                const statusOrder = [
                  "SUBMITTED",
                  "VERIFYING",
                  "UNDER_REVIEW",
                  "APPROVED",
                ];
                const currentIndex = statusOrder.indexOf(result.status);
                const isCompleted = i < currentIndex;
                const isActive = i === currentIndex;
                return (
                  <div
                    key={step.key}
                    className={`timeline-step ${isCompleted ? "completed" : ""} ${isActive ? "active" : ""}`}
                  >
                    <div className="timeline-dot">
                      {isCompleted ? "\u2713" : i + 1}
                    </div>
                    <div className="timeline-content">
                      <h4>{step.label}</h4>
                      <p>{step.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <span style={{ color: "var(--text-500)", fontSize: "0.85rem" }}>
        {label}
      </span>
      <span style={{ fontSize: "0.88rem", fontWeight: 500 }}>{value}</span>
    </div>
  );
}
