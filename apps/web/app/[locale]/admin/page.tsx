import { useLocale, useTranslations } from "next-intl";

function getApplications(locale: string) {
  if (locale === "zh") {
    return [
      { id: "app-001", name: "张伟", email: "zhangwei@school.edu", department: "计算机科学", status: "SUBMITTED", date: "2025-05-25" },
      { id: "app-002", name: "李明", email: "liming@school.edu", department: "电气工程", status: "UNDER_REVIEW", date: "2025-05-24" },
      { id: "app-003", name: "王芳", email: "wangfang@school.edu", department: "设计", status: "APPROVED", date: "2025-05-20" },
      { id: "app-004", name: "陈杰", email: "chenjie@school.edu", department: "数学", status: "REJECTED", date: "2025-05-18" },
      { id: "app-005", name: "刘洋", email: "liuyang@school.edu", department: "物理", status: "NEEDS_INFO", date: "2025-05-22" },
    ];
  }
  return [
    { id: "app-001", name: "Zhang Wei", email: "zhangwei@school.edu", department: "Computer Science", status: "SUBMITTED", date: "2025-05-25" },
    { id: "app-002", name: "Li Ming", email: "liming@school.edu", department: "Electrical Engineering", status: "UNDER_REVIEW", date: "2025-05-24" },
    { id: "app-003", name: "Wang Fang", email: "wangfang@school.edu", department: "Design", status: "APPROVED", date: "2025-05-20" },
    { id: "app-004", name: "Chen Jie", email: "chenjie@school.edu", department: "Mathematics", status: "REJECTED", date: "2025-05-18" },
    { id: "app-005", name: "Liu Yang", email: "liuyang@school.edu", department: "Physics", status: "NEEDS_INFO", date: "2025-05-22" },
  ];
}

export default function AdminPage() {
  const t = useTranslations("admin");
  const ts = useTranslations("statusLabel");
  const tc = useTranslations("common");
  const locale = useLocale();
  const applications = getApplications(locale);

  const adminNav = [
    { label: t("navApplications"), active: true },
    { label: t("navMembers"), active: false },
    { label: t("navInvitations"), active: false },
    { label: t("navCourses"), active: false },
    { label: t("navResources"), active: false },
    { label: t("navAuditLog"), active: false },
  ];

  return (
    <main className="page">
      <div className="page-header">
        <h1 className="page-title">{t("title")}</h1>
        <p className="page-subtitle">{t("subtitle")}</p>
      </div>

      <div className="admin-layout">
        <aside className="admin-sidebar">
          {adminNav.map((item) => (
            <a key={item.label} href="#" data-active={item.active}>
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
              {t("applicationReview")}
            </h2>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-sm btn-primary">{tc("all")}</button>
              <button className="btn btn-sm btn-ghost">{t("filterPending")}</button>
              <button className="btn btn-sm btn-ghost">{t("filterApproved")}</button>
              <button className="btn btn-sm btn-ghost">{t("filterRejected")}</button>
            </div>
          </div>

          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>{t("colApplicant")}</th>
                  <th>{t("colEmail")}</th>
                  <th>{t("colDepartment")}</th>
                  <th>{t("colStatus")}</th>
                  <th>{t("colSubmitted")}</th>
                  <th>{t("colActions")}</th>
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
                        {ts(app.status as "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "NEEDS_INFO")}
                      </span>
                    </td>
                    <td>{app.date}</td>
                    <td>
                      <button className="btn btn-sm btn-ghost">{tc("review")}</button>
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
