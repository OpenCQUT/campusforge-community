"use client";

import { useState, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";

type AppStatus = "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "NEEDS_INFO";

interface Application {
  id: string;
  name: string;
  email: string;
  studentId: string;
  department: string;
  reason: string;
  status: AppStatus;
  date: string;
  reviewNote: string;
}

function getInitialData(locale: string): Application[] {
  if (locale === "zh") {
    return [
      { id: "app-001", name: "张伟", email: "zhangwei@school.edu", studentId: "2024001", department: "计算机科学", reason: "我对开源项目非常感兴趣，希望能加入社区学习和贡献。我有 TypeScript 和 Python 的基础。", status: "SUBMITTED", date: "2025-05-25", reviewNote: "" },
      { id: "app-002", name: "李明", email: "liming@school.edu", studentId: "2024002", department: "电气工程", reason: "我想学习嵌入式系统开发，听说社区有相关的工作坊和课程。", status: "UNDER_REVIEW", date: "2025-05-24", reviewNote: "" },
      { id: "app-003", name: "王芳", email: "wangfang@school.edu", studentId: "2024003", department: "设计", reason: "我擅长 UI/UX 设计，想为社区项目贡献设计能力。", status: "APPROVED", date: "2025-05-20", reviewNote: "设计能力突出，欢迎加入。" },
      { id: "app-004", name: "陈杰", email: "chenjie@school.edu", studentId: "2024004", department: "数学", reason: "想加入。", status: "REJECTED", date: "2025-05-18", reviewNote: "申请理由过于简短，请补充详细信息后重新申请。" },
      { id: "app-005", name: "刘洋", email: "liuyang@school.edu", studentId: "2024005", department: "物理", reason: "我对数据分析和科学计算有兴趣，希望在社区中找到志同道合的伙伴。", status: "NEEDS_INFO", date: "2025-05-22", reviewNote: "请补充你的编程经验描述。" },
      { id: "app-006", name: "赵敏", email: "zhaomin@school.edu", studentId: "2024006", department: "计算机科学", reason: "大二学生，正在学习全栈开发，想通过社区项目积累实战经验。", status: "SUBMITTED", date: "2025-05-26", reviewNote: "" },
    ];
  }
  return [
    { id: "app-001", name: "Zhang Wei", email: "zhangwei@school.edu", studentId: "2024001", department: "Computer Science", reason: "I am very interested in open-source projects and hope to learn and contribute. I have experience with TypeScript and Python.", status: "SUBMITTED", date: "2025-05-25", reviewNote: "" },
    { id: "app-002", name: "Li Ming", email: "liming@school.edu", studentId: "2024002", department: "Electrical Engineering", reason: "I want to learn embedded systems development. I heard the community has workshops and courses.", status: "UNDER_REVIEW", date: "2025-05-24", reviewNote: "" },
    { id: "app-003", name: "Wang Fang", email: "wangfang@school.edu", studentId: "2024003", department: "Design", reason: "I specialize in UI/UX design and want to contribute design skills to community projects.", status: "APPROVED", date: "2025-05-20", reviewNote: "Strong design skills. Welcome!" },
    { id: "app-004", name: "Chen Jie", email: "chenjie@school.edu", studentId: "2024004", department: "Mathematics", reason: "Want to join.", status: "REJECTED", date: "2025-05-18", reviewNote: "Application reason is too brief. Please provide more detail and reapply." },
    { id: "app-005", name: "Liu Yang", email: "liuyang@school.edu", studentId: "2024005", department: "Physics", reason: "I am interested in data analysis and scientific computing, and hope to find like-minded peers in the community.", status: "NEEDS_INFO", date: "2025-05-22", reviewNote: "Please add a description of your programming experience." },
    { id: "app-006", name: "Zhao Min", email: "zhaomin@school.edu", studentId: "2024006", department: "Computer Science", reason: "Second-year student learning full-stack development. I want to gain practical experience through community projects.", status: "SUBMITTED", date: "2025-05-26", reviewNote: "" },
  ];
}

type FilterKey = "ALL" | "PENDING" | "APPROVED" | "REJECTED" | "NEEDS_INFO";

export default function AdminPage() {
  const t = useTranslations("admin");
  const ts = useTranslations("statusLabel");
  const tc = useTranslations("common");
  const locale = useLocale();

  const [applications, setApplications] = useState<Application[]>(() =>
    getInitialData(locale),
  );
  const [filter, setFilter] = useState<FilterKey>("ALL");
  const [selected, setSelected] = useState<Application | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [toast, setToast] = useState<{ type: string; message: string } | null>(
    null,
  );

  const showToast = useCallback((type: string, message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 2500);
  }, []);

  const filtered = applications.filter((app) => {
    if (filter === "ALL") return true;
    if (filter === "PENDING")
      return app.status === "SUBMITTED" || app.status === "UNDER_REVIEW";
    if (filter === "APPROVED") return app.status === "APPROVED";
    if (filter === "REJECTED") return app.status === "REJECTED";
    if (filter === "NEEDS_INFO") return app.status === "NEEDS_INFO";
    return true;
  });

  function handleReview(app: Application) {
    setSelected(app);
    setReviewNote(app.reviewNote);
  }

  function handleAction(status: AppStatus) {
    if (!selected) return;
    setApplications((prev) =>
      prev.map((a) =>
        a.id === selected.id
          ? { ...a, status, reviewNote }
          : a,
      ),
    );
    setSelected(null);
    setReviewNote("");
    const messages: Record<string, string> = {
      APPROVED: t("approved"),
      REJECTED: t("rejected"),
      NEEDS_INFO: t("infoRequested"),
    };
    showToast(
      status === "APPROVED"
        ? "success"
        : status === "REJECTED"
          ? "danger"
          : "info",
      messages[status] ?? "",
    );
  }

  const filters: { key: FilterKey; label: string; style: string }[] = [
    { key: "ALL", label: tc("all"), style: "btn-primary" },
    { key: "PENDING", label: t("filterPending"), style: "btn-ghost" },
    { key: "APPROVED", label: t("filterApproved"), style: "btn-ghost" },
    { key: "REJECTED", label: t("filterRejected"), style: "btn-ghost" },
    { key: "NEEDS_INFO", label: t("filterNeedsInfo"), style: "btn-ghost" },
  ];

  return (
    <main className="page">
      <div className="page-header">
        <h1 className="page-title">{t("title")}</h1>
        <p className="page-subtitle">{t("subtitle")}</p>
      </div>

      <div className="admin-layout">
        {/* Sidebar */}
        <aside className="admin-sidebar">
          {[
            t("navApplications"),
            t("navMembers"),
            t("navInvitations"),
            t("navCourses"),
            t("navResources"),
            t("navAuditLog"),
          ].map((label, i) => (
            <a key={label} href="#" data-active={i === 0}>
              {label}
            </a>
          ))}
        </aside>

        {/* Main content */}
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
              {filters.map((f) => (
                <button
                  key={f.key}
                  className={`btn btn-sm ${filter === f.key ? "btn-primary" : "btn-ghost"}`}
                  onClick={() => setFilter(f.key)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          {filtered.length === 0 ? (
            <div
              className="glass-card"
              style={{ padding: 40, textAlign: "center" }}
            >
              <p style={{ color: "var(--text-500)" }}>{t("noApplications")}</p>
            </div>
          ) : (
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
                  {filtered.map((app) => (
                    <tr key={app.id}>
                      <td style={{ fontWeight: 600 }}>{app.name}</td>
                      <td>{app.email}</td>
                      <td>{app.department}</td>
                      <td>
                        <span
                          className={`status status-${app.status.toLowerCase().replace("_", "-")}`}
                        >
                          {ts(app.status)}
                        </span>
                      </td>
                      <td>{app.date}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-ghost"
                          onClick={() => handleReview(app)}
                        >
                          {tc("review")}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Review Drawer */}
      {selected && (
        <>
          <div className="drawer-overlay" onClick={() => setSelected(null)} />
          <div className="drawer">
            <div className="drawer-header">
              <h2>{t("drawerTitle")}</h2>
              <button
                className="btn btn-sm btn-ghost"
                onClick={() => setSelected(null)}
              >
                {t("close")}
              </button>
            </div>

            <div className="drawer-body">
              <div>
                <div className="detail-row">
                  <span className="detail-label">{t("colApplicant")}</span>
                  <span className="detail-value">{selected.name}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">{t("colEmail")}</span>
                  <span className="detail-value">{selected.email}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">{t("colDepartment")}</span>
                  <span className="detail-value">{selected.department}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">
                    {locale === "zh" ? "学号" : "Student ID"}
                  </span>
                  <span className="detail-value">{selected.studentId}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">{t("colSubmitted")}</span>
                  <span className="detail-value">{selected.date}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">{t("colStatus")}</span>
                  <span className="detail-value">
                    <span
                      className={`status status-${selected.status.toLowerCase().replace("_", "-")}`}
                    >
                      {ts(selected.status)}
                    </span>
                  </span>
                </div>
              </div>

              <div>
                <h3
                  style={{
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    marginBottom: 8,
                    color: "var(--text-300)",
                  }}
                >
                  {t("reason")}
                </h3>
                <p
                  className="glass-card"
                  style={{
                    padding: 16,
                    fontSize: "0.88rem",
                    lineHeight: 1.7,
                    color: "var(--text-300)",
                  }}
                >
                  {selected.reason}
                </p>
              </div>

              <div className="field">
                <label htmlFor="review-note">{t("reviewNote")}</label>
                <textarea
                  id="review-note"
                  rows={3}
                  placeholder={t("reviewNotePlaceholder")}
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                />
              </div>
            </div>

            <div className="drawer-footer">
              <button
                className="btn btn-sm"
                style={{
                  background: "rgba(255,95,125,0.15)",
                  color: "var(--danger)",
                  border: "1px solid rgba(255,95,125,0.3)",
                }}
                onClick={() => handleAction("REJECTED")}
              >
                {t("reject")}
              </button>
              <button
                className="btn btn-sm"
                style={{
                  background: "rgba(47,128,255,0.15)",
                  color: "var(--blue)",
                  border: "1px solid rgba(47,128,255,0.3)",
                }}
                onClick={() => handleAction("NEEDS_INFO")}
              >
                {t("requestInfo")}
              </button>
              <button
                className="btn btn-sm"
                style={{
                  background: "rgba(33,214,162,0.15)",
                  color: "var(--success)",
                  border: "1px solid rgba(33,214,162,0.3)",
                }}
                onClick={() => handleAction("APPROVED")}
              >
                {t("approve")}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Toast */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>{toast.message}</div>
      )}
    </main>
  );
}
