const applications = [
  {
    id: "app-001",
    name: "Zhang Wei",
    email: "zhangwei@school.edu",
    department: "Computer Science",
    status: "SUBMITTED",
    submittedAt: "2025-05-25",
  },
  {
    id: "app-002",
    name: "Li Ming",
    email: "liming@school.edu",
    department: "Electrical Engineering",
    status: "UNDER_REVIEW",
    submittedAt: "2025-05-24",
  },
  {
    id: "app-003",
    name: "Wang Fang",
    email: "wangfang@school.edu",
    department: "Design",
    status: "APPROVED",
    submittedAt: "2025-05-20",
  },
  {
    id: "app-004",
    name: "Chen Jie",
    email: "chenjie@school.edu",
    department: "Mathematics",
    status: "REJECTED",
    submittedAt: "2025-05-18",
  },
  {
    id: "app-005",
    name: "Liu Yang",
    email: "liuyang@school.edu",
    department: "Physics",
    status: "NEEDS_INFO",
    submittedAt: "2025-05-22",
  },
];

const adminNav = [
  { label: "Applications", href: "/admin", active: true },
  { label: "Members", href: "/admin", active: false },
  { label: "Invitations", href: "/admin", active: false },
  { label: "Courses", href: "/admin", active: false },
  { label: "Resources", href: "/admin", active: false },
  { label: "Audit Log", href: "/admin", active: false },
];

export default function AdminPage() {
  return (
    <main className="page">
      <div className="page-header">
        <h1 className="page-title">Admin</h1>
        <p className="page-subtitle">
          Manage applications, members, and community resources.
        </p>
      </div>

      <div className="admin-layout">
        <aside className="admin-sidebar">
          {adminNav.map((item) => (
            <a
              key={item.label}
              href={item.href}
              data-active={item.active}
            >
              {item.label}
            </a>
          ))}
        </aside>

        <div className="admin-main">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700 }}>
              Application Review
            </h2>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-sm btn-primary">All</button>
              <button className="btn btn-sm btn-ghost">Pending</button>
              <button className="btn btn-sm btn-ghost">Approved</button>
              <button className="btn btn-sm btn-ghost">Rejected</button>
            </div>
          </div>

          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Applicant</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app.id}>
                    <td style={{ fontWeight: 600 }}>{app.name}</td>
                    <td>{app.email}</td>
                    <td>{app.department}</td>
                    <td>
                      <span
                        className={`status status-${app.status.toLowerCase().replace("_", "-")}`}
                      >
                        {app.status.replace("_", " ")}
                      </span>
                    </td>
                    <td>{app.submittedAt}</td>
                    <td>
                      <button className="btn btn-sm btn-ghost">Review</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
