export default function StatusPage() {
  // Mock data for display — will be replaced with API call
  const application = {
    id: "demo-001",
    schoolEmail: "student@school.edu",
    studentId: "2024001",
    department: "Computer Science",
    status: "UNDER_REVIEW" as const,
    submittedAt: "2025-05-20",
    reviewedAt: null as string | null,
  };

  const steps = [
    { key: "SUBMITTED", label: "Submitted", description: "Your application has been received." },
    { key: "VERIFYING", label: "Verifying", description: "School email and student ID are being verified." },
    { key: "UNDER_REVIEW", label: "Under Review", description: "An admin is reviewing your application." },
    { key: "APPROVED", label: "Decision", description: "You will be notified of the final decision." },
  ];

  const statusOrder = ["SUBMITTED", "VERIFYING", "UNDER_REVIEW", "APPROVED"];
  const currentIndex = statusOrder.indexOf(application.status);

  return (
    <main className="page">
      <div className="page-header">
        <h1 className="page-title">Application Status</h1>
        <p className="page-subtitle">
          Track the progress of your community invitation application.
        </p>
      </div>

      <div className="grid-2">
        {/* Application details */}
        <div className="glass-card" style={{ padding: 32 }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 20 }}>
            Application Details
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <DetailRow label="Application ID" value={application.id} />
            <DetailRow label="School Email" value={application.schoolEmail} />
            <DetailRow label="Student ID" value={application.studentId} />
            <DetailRow label="Department" value={application.department} />
            <DetailRow label="Submitted" value={application.submittedAt} />
            <DetailRow
              label="Status"
              value={
                <span className={`status status-${application.status.toLowerCase().replace("_", "-")}`}>
                  {application.status.replace("_", " ")}
                </span>
              }
            />
          </div>
        </div>

        {/* Timeline */}
        <div className="glass-card" style={{ padding: 32 }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 20 }}>
            Progress
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
