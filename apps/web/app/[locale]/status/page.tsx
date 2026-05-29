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

const STATUS_PROGRESS_INDEX: Record<Application["status"], number> = {
  SUBMITTED: 0,
  VERIFYING: 1,
  UNDER_REVIEW: 2,
  APPROVED: 3,
  REJECTED: 3,
  NEEDS_INFO: 3,
};

const DECISION_OUTCOME_CLASS: Partial<Record<Application["status"], string>> = {
  APPROVED: "approved",
  REJECTED: "rejected",
  NEEDS_INFO: "needs-info",
};

// No demo data — all applications come from the shared store
const MOCK_DB: Record<string, Application> = {};

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
    <main className={`page status-page ${result ? "status-page-has-result" : "status-page-empty"}`}>
      <div className="page-header status-page-header">
        <h1 className="page-title">{t("title")}</h1>
        <p className="page-subtitle">{t("subtitle")}</p>
      </div>

      <form
        onSubmit={handleSearch}
        className="glass-card status-search-card"
      >
        <div className="field">
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
          className="glass-card status-message-card"
          style={{
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
        <div className="grid-2 status-result-grid">
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
                const currentIndex = STATUS_PROGRESS_INDEX[result.status];
                const isCompleted = i < currentIndex;
                const isActive = i === currentIndex;
                const outcomeClass = isActive && i === steps.length - 1
                  ? DECISION_OUTCOME_CLASS[result.status] ?? ""
                  : "";
                return (
                  <div
                    key={step.key}
                    className={`timeline-step ${isCompleted ? "completed" : ""} ${isActive ? "active" : ""} ${outcomeClass}`}
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
