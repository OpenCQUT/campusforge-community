const resources = [
  {
    title: "Git & GitHub Starter Guide",
    description: "Learn the basics of version control with Git and collaboration workflows on GitHub.",
    type: "Guide",
    updatedAt: "2025-05-15",
  },
  {
    title: "Project Proposal Template",
    description: "A structured template for proposing new open-source projects within the community.",
    type: "Template",
    updatedAt: "2025-05-10",
  },
  {
    title: "VS Code Extension Pack",
    description: "Curated set of VS Code extensions for TypeScript, React, and Python development.",
    type: "Tool",
    updatedAt: "2025-05-08",
  },
  {
    title: "Code Review Guidelines",
    description: "Best practices for giving and receiving constructive code reviews.",
    type: "Internal Doc",
    updatedAt: "2025-04-28",
  },
  {
    title: "Resource Sharing Policy",
    description: "Rules and guidelines for sharing resources in the community repository.",
    type: "Policy",
    updatedAt: "2025-04-20",
  },
];

const typeColors: Record<string, string> = {
  Guide: "tag-purple",
  Template: "tag-blue",
  Tool: "tag-cyan",
  Policy: "tag-muted",
  "Internal Doc": "tag-success",
};

export default function ResourcesPage() {
  return (
    <main className="page">
      <div className="page-header">
        <h1 className="page-title">Resources</h1>
        <p className="page-subtitle">
          Guides, templates, tools, and documents shared by the community.
        </p>
      </div>

      {/* Filter bar */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 24,
          flexWrap: "wrap",
        }}
      >
        <button className="btn btn-sm btn-primary">All</button>
        <button className="btn btn-sm btn-ghost">Guide</button>
        <button className="btn btn-sm btn-ghost">Template</button>
        <button className="btn btn-sm btn-ghost">Tool</button>
        <button className="btn btn-sm btn-ghost">Policy</button>
        <button className="btn btn-sm btn-ghost">Internal Doc</button>
      </div>

      <div className="grid-3">
        {resources.map((r) => (
          <div key={r.title} className="glass-card content-card">
            <div className="content-meta">
              <span className={`tag ${typeColors[r.type] ?? "tag-muted"}`}>
                {r.type}
              </span>
            </div>
            <h3>{r.title}</h3>
            <p>{r.description}</p>
            <div className="content-meta">
              <span>Updated {r.updatedAt}</span>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
