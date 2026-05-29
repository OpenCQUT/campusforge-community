const policies = [
  {
    title: "Code of Conduct",
    description:
      "Standards for behavior and communication within the community. All members are expected to follow these guidelines.",
    status: "Active",
    version: 2,
    updatedAt: "2025-05-01",
  },
  {
    title: "Invitation Rules",
    description:
      "How the invitation system works, eligibility criteria, and the review process for new members.",
    status: "Active",
    version: 1,
    updatedAt: "2025-04-15",
  },
  {
    title: "Resource Sharing Policy",
    description:
      "Rules for submitting, maintaining, and archiving resources in the community repository.",
    status: "Active",
    version: 1,
    updatedAt: "2025-04-10",
  },
  {
    title: "Security & Privacy",
    description:
      "Data handling practices, vulnerability reporting procedures, and privacy commitments.",
    status: "Active",
    version: 1,
    updatedAt: "2025-04-05",
  },
  {
    title: "Course Participation Guide",
    description:
      "Expectations for course participants, cohort etiquette, and certification requirements.",
    status: "Draft",
    version: 1,
    updatedAt: "2025-05-20",
  },
];

const statusColors: Record<string, string> = {
  Active: "tag-success",
  Draft: "tag-muted",
  Reviewed: "tag-blue",
  Archived: "tag-danger",
};

export default function PoliciesPage() {
  return (
    <main className="page">
      <div className="page-header">
        <h1 className="page-title">Policies & Governance</h1>
        <p className="page-subtitle">
          Community rules, guidelines, and governance documents.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {policies.map((p) => (
          <div key={p.title} className="glass-card policy-card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 16,
              }}
            >
              <div>
                <h3>{p.title}</h3>
                <p>{p.description}</p>
              </div>
              <span className={`tag ${statusColors[p.status] ?? "tag-muted"}`}>
                {p.status}
              </span>
            </div>
            <div className="policy-footer">
              <span style={{ fontSize: "0.78rem", color: "var(--text-500)" }}>
                Version {p.version} &middot; Updated {p.updatedAt}
              </span>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
