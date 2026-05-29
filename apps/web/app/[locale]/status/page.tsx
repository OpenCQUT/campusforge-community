import { useTranslations } from "next-intl";

export default function StatusPage() {
  const t = useTranslations("status");
  const ts = useTranslations("statusLabel");

  const application = {
    id: "demo-001",
    schoolEmail: "student@school.edu",
    studentId: "2024001",
    department: "Computer Science",
    status: "UNDER_REVIEW" as const,
    submittedAt: "2025-05-20",
  };

  const steps = [
    { key: "SUBMITTED", label: t("stepSubmitted"), description: t("stepSubmittedDesc") },
    { key: "VERIFYING", label: t("stepVerifying"), description: t("stepVerifyingDesc") },
    { key: "UNDER_REVIEW", label: t("stepReview"), description: t("stepReviewDesc") },
    { key: "APPROVED", label: t("stepDecision"), description: t("stepDecisionDesc") },
  ];

  const statusOrder = ["SUBMITTED", "VERIFYING", "UNDER_REVIEW", "APPROVED"];
  const currentIndex = statusOrder.indexOf(application.status);

  return (
    <main className="page">
      <div className="page-header">
        <h1 className="page-title">{t("title")}</h1>
        <p className="page-subtitle">{t("subtitle")}</p>
      </div>

      <div className="grid-2">
        <div className="glass-card" style={{ padding: 32 }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 20 }}>
            {t("details")}
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <DetailRow label={t("appId")} value={application.id} />
            <DetailRow label={t("schoolEmail")} value={application.schoolEmail} />
            <DetailRow label={t("studentId")} value={application.studentId} />
            <DetailRow label={t("department")} value={application.department} />
            <DetailRow label={t("submitted")} value={application.submittedAt} />
            <DetailRow
              label={t("currentStatus")}
              value={
                <span className={`status status-${application.status.toLowerCase().replace("_", "-")}`}>
                  {ts(application.status)}
                </span>
              }
            />
          </div>
        </div>

        <div className="glass-card" style={{ padding: 32 }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 20 }}>
            {t("progress")}
          </h2>
          <div className="status-timeline">
            {steps.map((step, i) => {
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
    </main>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ color: "var(--text-500)", fontSize: "0.85rem" }}>{label}</span>
      <span style={{ fontSize: "0.88rem", fontWeight: 500 }}>{value}</span>
    </div>
  );
}
