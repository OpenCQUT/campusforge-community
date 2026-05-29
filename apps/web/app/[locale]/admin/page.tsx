"use client";

import { useState, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";

// ─── Types ──────────────────────────────────────────────────────────────────

type AppStatus = "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "NEEDS_INFO";
type Role = "STUDENT" | "MEMBER" | "MAINTAINER" | "ADMIN";
type CourseStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";
type Section = "applications" | "members" | "invitations" | "courses" | "resources" | "audit";

interface Application {
  id: string; name: string; email: string; studentId: string;
  department: string; reason: string; status: AppStatus; date: string; reviewNote: string;
}
interface Member {
  id: string; name: string; email: string; studentId: string;
  department: string; role: Role; joinedAt: string;
}
interface Invitation {
  id: string; code: string; applicantName: string; email: string;
  expiresAt: string; usedAt: string | null; revoked: boolean;
}
interface CourseItem {
  id: string; title: string; type: string; status: CourseStatus;
  difficulty: string; students: number;
}
interface ResourceItem {
  id: string; title: string; type: string; status: "ACTIVE" | "ARCHIVED"; updatedAt: string;
}
interface AuditEntry {
  id: string; actor: string; action: string; target: string; time: string;
}

// ─── Mock Data Factories ────────────────────────────────────────────────────

function applicationsData(l: string): Application[] {
  const zh = [
    { id: "a1", name: "张伟", email: "zhangwei@school.edu", studentId: "2024001", department: "计算机科学", reason: "对开源项目非常感兴趣，希望学习和贡献。有 TypeScript 和 Python 基础。", status: "SUBMITTED" as AppStatus, date: "2025-05-25", reviewNote: "" },
    { id: "a2", name: "李明", email: "liming@school.edu", studentId: "2024002", department: "电气工程", reason: "想学习嵌入式系统开发，听说社区有相关工作坊和课程。", status: "UNDER_REVIEW" as AppStatus, date: "2025-05-24", reviewNote: "" },
    { id: "a3", name: "王芳", email: "wangfang@school.edu", studentId: "2024003", department: "设计", reason: "擅长 UI/UX 设计，想为社区项目贡献设计能力。", status: "APPROVED" as AppStatus, date: "2025-05-20", reviewNote: "设计能力突出。" },
    { id: "a4", name: "陈杰", email: "chenjie@school.edu", studentId: "2024004", department: "数学", reason: "想加入。", status: "REJECTED" as AppStatus, date: "2025-05-18", reviewNote: "理由过于简短。" },
    { id: "a5", name: "刘洋", email: "liuyang@school.edu", studentId: "2024005", department: "物理", reason: "对数据分析和科学计算有兴趣，希望找到志同道合的伙伴。", status: "NEEDS_INFO" as AppStatus, date: "2025-05-22", reviewNote: "请补充编程经验。" },
    { id: "a6", name: "赵敏", email: "zhaomin@school.edu", studentId: "2024006", department: "计算机科学", reason: "大二学生，正在学习全栈开发，想通过社区项目积累实战经验。", status: "SUBMITTED" as AppStatus, date: "2025-05-26", reviewNote: "" },
  ];
  const en = [
    { id: "a1", name: "Zhang Wei", email: "zhangwei@school.edu", studentId: "2024001", department: "Computer Science", reason: "Very interested in open-source projects. Experienced with TypeScript and Python.", status: "SUBMITTED" as AppStatus, date: "2025-05-25", reviewNote: "" },
    { id: "a2", name: "Li Ming", email: "liming@school.edu", studentId: "2024002", department: "Electrical Engineering", reason: "Want to learn embedded systems development. Heard the community has workshops.", status: "UNDER_REVIEW" as AppStatus, date: "2025-05-24", reviewNote: "" },
    { id: "a3", name: "Wang Fang", email: "wangfang@school.edu", studentId: "2024003", department: "Design", reason: "Specialize in UI/UX design. Want to contribute design skills to projects.", status: "APPROVED" as AppStatus, date: "2025-05-20", reviewNote: "Strong design skills." },
    { id: "a4", name: "Chen Jie", email: "chenjie@school.edu", studentId: "2024004", department: "Mathematics", reason: "Want to join.", status: "REJECTED" as AppStatus, date: "2025-05-18", reviewNote: "Reason too brief." },
    { id: "a5", name: "Liu Yang", email: "liuyang@school.edu", studentId: "2024005", department: "Physics", reason: "Interested in data analysis and scientific computing.", status: "NEEDS_INFO" as AppStatus, date: "2025-05-22", reviewNote: "Add programming experience." },
    { id: "a6", name: "Zhao Min", email: "zhaomin@school.edu", studentId: "2024006", department: "Computer Science", reason: "Second-year student learning full-stack development.", status: "SUBMITTED" as AppStatus, date: "2025-05-26", reviewNote: "" },
  ];
  return l === "zh" ? zh : en;
}

function membersData(l: string): Member[] {
  if (l === "zh") return [
    { id: "m1", name: "王芳", email: "wangfang@school.edu", studentId: "2024003", department: "设计", role: "MEMBER", joinedAt: "2025-05-21" },
    { id: "m2", name: "孙鹏", email: "sunpeng@school.edu", studentId: "2023010", department: "计算机科学", role: "MAINTAINER", joinedAt: "2025-03-10" },
    { id: "m3", name: "周琳", email: "zhoulin@school.edu", studentId: "2023022", department: "软件工程", role: "MEMBER", joinedAt: "2025-04-05" },
    { id: "m4", name: "管理员", email: "test@admin.edu", studentId: "-", department: "-", role: "ADMIN", joinedAt: "2025-01-01" },
  ];
  return [
    { id: "m1", name: "Wang Fang", email: "wangfang@school.edu", studentId: "2024003", department: "Design", role: "MEMBER", joinedAt: "2025-05-21" },
    { id: "m2", name: "Sun Peng", email: "sunpeng@school.edu", studentId: "2023010", department: "Computer Science", role: "MAINTAINER", joinedAt: "2025-03-10" },
    { id: "m3", name: "Zhou Lin", email: "zhoulin@school.edu", studentId: "2023022", department: "Software Engineering", role: "MEMBER", joinedAt: "2025-04-05" },
    { id: "m4", name: "Admin", email: "test@admin.edu", studentId: "-", department: "-", role: "ADMIN", joinedAt: "2025-01-01" },
  ];
}

function invitationsData(l: string): Invitation[] {
  if (l === "zh") return [
    { id: "i1", code: "CFG-A3-WF-2025", applicantName: "王芳", email: "wangfang@school.edu", expiresAt: "2025-06-20", usedAt: "2025-05-21", revoked: false },
    { id: "i2", code: "CFG-A2-LM-2025", applicantName: "李明", email: "liming@school.edu", expiresAt: "2025-06-24", usedAt: null, revoked: false },
    { id: "i3", code: "CFG-A4-CJ-2025", applicantName: "陈杰", email: "chenjie@school.edu", expiresAt: "2025-06-18", usedAt: null, revoked: true },
  ];
  return [
    { id: "i1", code: "CFG-A3-WF-2025", applicantName: "Wang Fang", email: "wangfang@school.edu", expiresAt: "2025-06-20", usedAt: "2025-05-21", revoked: false },
    { id: "i2", code: "CFG-A2-LM-2025", applicantName: "Li Ming", email: "liming@school.edu", expiresAt: "2025-06-24", usedAt: null, revoked: false },
    { id: "i3", code: "CFG-A4-CJ-2025", applicantName: "Chen Jie", email: "chenjie@school.edu", expiresAt: "2025-06-18", usedAt: null, revoked: true },
  ];
}

function coursesData(l: string): CourseItem[] {
  if (l === "zh") return [
    { id: "c1", title: "开源入门", type: "自学课程", status: "ACTIVE", difficulty: "初级", students: 28 },
    { id: "c2", title: "React 与 Next.js 工作坊", type: "工作坊", status: "ACTIVE", difficulty: "中级", students: 15 },
    { id: "c3", title: "新成员入职培训", type: "入职培训", status: "ACTIVE", difficulty: "初级", students: 42 },
    { id: "c4", title: "TypeScript 深入学习", type: "课程组", status: "DRAFT", difficulty: "高级", students: 0 },
  ];
  return [
    { id: "c1", title: "Introduction to Open Source", type: "Self Study", status: "ACTIVE", difficulty: "Beginner", students: 28 },
    { id: "c2", title: "React & Next.js Workshop", type: "Workshop", status: "ACTIVE", difficulty: "Intermediate", students: 15 },
    { id: "c3", title: "New Member Onboarding", type: "Onboarding", status: "ACTIVE", difficulty: "Beginner", students: 42 },
    { id: "c4", title: "TypeScript Deep Dive", type: "Cohort", status: "DRAFT", difficulty: "Advanced", students: 0 },
  ];
}

function resourcesData(l: string): ResourceItem[] {
  if (l === "zh") return [
    { id: "r1", title: "Git 与 GitHub 入门指南", type: "Guide", status: "ACTIVE", updatedAt: "2025-05-15" },
    { id: "r2", title: "项目提案模板", type: "Template", status: "ACTIVE", updatedAt: "2025-05-10" },
    { id: "r3", title: "VS Code 扩展包", type: "Tool", status: "ACTIVE", updatedAt: "2025-05-08" },
    { id: "r4", title: "代码审查指南", type: "Internal Doc", status: "ARCHIVED", updatedAt: "2025-03-01" },
  ];
  return [
    { id: "r1", title: "Git & GitHub Starter Guide", type: "Guide", status: "ACTIVE", updatedAt: "2025-05-15" },
    { id: "r2", title: "Project Proposal Template", type: "Template", status: "ACTIVE", updatedAt: "2025-05-10" },
    { id: "r3", title: "VS Code Extension Pack", type: "Tool", status: "ACTIVE", updatedAt: "2025-05-08" },
    { id: "r4", title: "Code Review Guidelines", type: "Internal Doc", status: "ARCHIVED", updatedAt: "2025-03-01" },
  ];
}

function auditData(l: string): AuditEntry[] {
  if (l === "zh") return [
    { id: "log1", actor: "管理员", action: "批准申请", target: "王芳 (app-003)", time: "2025-05-20 14:30" },
    { id: "log2", actor: "管理员", action: "拒绝申请", target: "陈杰 (app-004)", time: "2025-05-18 09:15" },
    { id: "log3", actor: "管理员", action: "要求补充信息", target: "刘洋 (app-005)", time: "2025-05-22 16:45" },
    { id: "log4", actor: "管理员", action: "撤销邀请", target: "CFG-A4-CJ-2025", time: "2025-05-18 09:20" },
    { id: "log5", actor: "管理员", action: "归档资源", target: "代码审查指南", time: "2025-05-17 11:00" },
  ];
  return [
    { id: "log1", actor: "Admin", action: "Approved application", target: "Wang Fang (app-003)", time: "2025-05-20 14:30" },
    { id: "log2", actor: "Admin", action: "Rejected application", target: "Chen Jie (app-004)", time: "2025-05-18 09:15" },
    { id: "log3", actor: "Admin", action: "Requested info", target: "Liu Yang (app-005)", time: "2025-05-22 16:45" },
    { id: "log4", actor: "Admin", action: "Revoked invitation", target: "CFG-A4-CJ-2025", time: "2025-05-18 09:20" },
    { id: "log5", actor: "Admin", action: "Archived resource", target: "Code Review Guidelines", time: "2025-05-17 11:00" },
  ];
}

// ─── Role colors ────────────────────────────────────────────────────────────

const roleColors: Record<Role, string> = {
  STUDENT: "tag-muted", MEMBER: "tag-blue", MAINTAINER: "tag-purple", ADMIN: "tag-cyan",
};

// ─── Main Component ─────────────────────────────────────────────────────────

export default function AdminPage() {
  const t = useTranslations("admin");
  const ts = useTranslations("statusLabel");
  const tc = useTranslations("common");
  const locale = useLocale();

  const [section, setSection] = useState<Section>("applications");
  const [toast, setToast] = useState<{ type: string; msg: string } | null>(null);

  const showToast = useCallback((type: string, msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 2500);
  }, []);

  // Data state
  const [applications, setApplications] = useState(() => applicationsData(locale));
  const [members, setMembers] = useState(() => membersData(locale));
  const [invitations, setInvitations] = useState(() => invitationsData(locale));
  const [courses, setCourses] = useState(() => coursesData(locale));
  const [resources, setResources] = useState(() => resourcesData(locale));
  const [auditLog, setAuditLog] = useState(() => auditData(locale));

  // Applications state
  const [appFilter, setAppFilter] = useState<string>("ALL");
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [reviewNote, setReviewNote] = useState("");

  // Members state
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  function addAuditEntry(action: string, target: string) {
    const now = new Date();
    const time = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    setAuditLog((prev) => [
      { id: `log-${Date.now()}`, actor: "Admin", action, target, time },
      ...prev,
    ]);
  }

  function handleAppAction(status: AppStatus) {
    if (!selectedApp) return;
    const label = status === "APPROVED" ? t("approved") : status === "REJECTED" ? t("rejected") : t("infoRequested");
    setApplications((prev) => prev.map((a) => a.id === selectedApp.id ? { ...a, status, reviewNote } : a));
    addAuditEntry(`${status} application`, `${selectedApp.name} (${selectedApp.id})`);
    setSelectedApp(null); setReviewNote("");
    showToast(status === "APPROVED" ? "success" : status === "REJECTED" ? "danger" : "info", label);
  }

  function handleRoleChange(memberId: string, newRole: Role) {
    setMembers((prev) => prev.map((m) => m.id === memberId ? { ...m, role: newRole } : m));
    const m = members.find((x) => x.id === memberId);
    if (m) addAuditEntry(`Changed role to ${newRole}`, m.name);
    showToast("success", tc("review"));
  }

  function handleRevokeInvite(id: string) {
    setInvitations((prev) => prev.map((inv) => inv.id === id ? { ...inv, revoked: true } : inv));
    const inv = invitations.find((x) => x.id === id);
    if (inv) addAuditEntry("Revoked invitation", inv.code);
    showToast("danger", t("revoked"));
  }

  function handleCourseStatus(id: string, newStatus: CourseStatus) {
    setCourses((prev) => prev.map((c) => c.id === id ? { ...c, status: newStatus } : c));
    const c = courses.find((x) => x.id === id);
    if (c) addAuditEntry(`Set course to ${newStatus}`, c.title);
    showToast("success", t("courseUpdated"));
  }

  function handleResourceArchive(id: string) {
    setResources((prev) => prev.map((r) => r.id === id ? { ...r, status: "ARCHIVED" } : r));
    const r = resources.find((x) => x.id === id);
    if (r) addAuditEntry("Archived resource", r.title);
    showToast("success", t("resourceUpdated"));
  }

  // Sidebar config
  const sidebarItems: { key: Section; label: string }[] = [
    { key: "applications", label: t("navApplications") },
    { key: "members", label: t("navMembers") },
    { key: "invitations", label: t("navInvitations") },
    { key: "courses", label: t("navCourses") },
    { key: "resources", label: t("navResources") },
    { key: "audit", label: t("navAuditLog") },
  ];

  const appFilters = [
    { key: "ALL", label: tc("all") },
    { key: "PENDING", label: t("filterPending") },
    { key: "APPROVED", label: t("filterApproved") },
    { key: "REJECTED", label: t("filterRejected") },
    { key: "NEEDS_INFO", label: t("filterNeedsInfo") },
  ];

  const filteredApps = applications.filter((a) => {
    if (appFilter === "ALL") return true;
    if (appFilter === "PENDING") return a.status === "SUBMITTED" || a.status === "UNDER_REVIEW";
    return a.status === appFilter;
  });

  return (
    <main className="page">
      <div className="page-header">
        <h1 className="page-title">{t("title")}</h1>
        <p className="page-subtitle">{t("subtitle")}</p>
      </div>

      <div className="admin-layout">
        {/* Sidebar */}
        <aside className="admin-sidebar">
          {sidebarItems.map((item) => (
            <a key={item.key} href="#" data-active={section === item.key} onClick={(e) => { e.preventDefault(); setSection(item.key); }}>
              {item.label}
            </a>
          ))}
        </aside>

        <div className="admin-main">
          {/* ── Applications ─────────────────────────────────── */}
          {section === "applications" && (
            <>
              <SectionHeader title={t("applicationReview")}>
                {appFilters.map((f) => (
                  <button key={f.key} className={`btn btn-sm ${appFilter === f.key ? "btn-primary" : "btn-ghost"}`} onClick={() => setAppFilter(f.key)}>
                    {f.label}
                  </button>
                ))}
              </SectionHeader>
              {filteredApps.length === 0 ? <Empty msg={t("noApplications")} /> : (
                <div className="table-wrap"><table className="table"><thead><tr>
                  <th>{t("colApplicant")}</th><th>{t("colEmail")}</th><th>{t("colDepartment")}</th><th>{t("colStatus")}</th><th>{t("colSubmitted")}</th><th>{t("colActions")}</th>
                </tr></thead><tbody>
                  {filteredApps.map((a) => (
                    <tr key={a.id}>
                      <td style={{ fontWeight: 600 }}>{a.name}</td>
                      <td>{a.email}</td><td>{a.department}</td>
                      <td><span className={`status status-${a.status.toLowerCase().replace("_", "-")}`}>{ts(a.status)}</span></td>
                      <td>{a.date}</td>
                      <td><button className="btn btn-sm btn-ghost" onClick={() => { setSelectedApp(a); setReviewNote(a.reviewNote); }}>{tc("review")}</button></td>
                    </tr>
                  ))}
                </tbody></table></div>
              )}
            </>
          )}

          {/* ── Members ──────────────────────────────────────── */}
          {section === "members" && (
            <>
              <SectionHeader title={t("memberTitle")} subtitle={t("memberSubtitle")} />
              <div className="table-wrap"><table className="table"><thead><tr>
                <th>{t("colName")}</th><th>{t("colEmail")}</th><th>{t("colStudentId")}</th><th>{t("colDepartment")}</th><th>{t("colRole")}</th><th>{t("colJoined")}</th><th>{t("colActions")}</th>
              </tr></thead><tbody>
                {members.map((m) => (
                  <tr key={m.id}>
                    <td style={{ fontWeight: 600 }}>{m.name}</td>
                    <td>{m.email}</td><td>{m.studentId}</td><td>{m.department}</td>
                    <td><span className={`tag ${roleColors[m.role]}`}>{m.role}</span></td>
                    <td>{m.joinedAt}</td>
                    <td><button className="btn btn-sm btn-ghost" onClick={() => setSelectedMember(m)}>{t("changeRole")}</button></td>
                  </tr>
                ))}
              </tbody></table></div>
            </>
          )}

          {/* ── Invitations ──────────────────────────────────── */}
          {section === "invitations" && (
            <>
              <SectionHeader title={t("invitationTitle")} subtitle={t("invitationSubtitle")} />
              {invitations.length === 0 ? <Empty msg={t("noInvitations")} /> : (
                <div className="table-wrap"><table className="table"><thead><tr>
                  <th>{t("colCode")}</th><th>{t("colApplicant")}</th><th>{t("colEmail")}</th><th>{t("colExpires")}</th><th>{t("colUsed")}</th><th>{t("colStatus")}</th><th>{t("colActions")}</th>
                </tr></thead><tbody>
                  {invitations.map((inv) => (
                    <tr key={inv.id} style={{ opacity: inv.revoked ? 0.5 : 1 }}>
                      <td style={{ fontFamily: "monospace", fontSize: "0.82rem" }}>{inv.code}</td>
                      <td>{inv.applicantName}</td><td>{inv.email}</td><td>{inv.expiresAt}</td>
                      <td>{inv.usedAt ?? "—"}</td>
                      <td>
                        {inv.revoked ? <span className="tag tag-danger">Revoked</span>
                          : inv.usedAt ? <span className="tag tag-success">Used</span>
                          : <span className="tag tag-blue">Active</span>}
                      </td>
                      <td>
                        {!inv.revoked && !inv.usedAt && (
                          <button className="btn btn-sm btn-ghost" style={{ color: "var(--danger)" }} onClick={() => handleRevokeInvite(inv.id)}>{t("revoke")}</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody></table></div>
              )}
            </>
          )}

          {/* ── Courses ──────────────────────────────────────── */}
          {section === "courses" && (
            <>
              <SectionHeader title={t("courseTitle")} subtitle={t("courseSubtitle")} />
              {courses.length === 0 ? <Empty msg={t("noCourses")} /> : (
                <div className="table-wrap"><table className="table"><thead><tr>
                  <th>{t("colTitle")}</th><th>{t("colType")}</th><th>{t("colDifficulty")}</th><th>{t("colStudents")}</th><th>{t("colStatus")}</th><th>{t("colActions")}</th>
                </tr></thead><tbody>
                  {courses.map((c) => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 600 }}>{c.title}</td>
                      <td>{c.type}</td><td>{c.difficulty}</td><td>{c.students}</td>
                      <td><span className={`tag ${c.status === "ACTIVE" ? "tag-success" : c.status === "DRAFT" ? "tag-muted" : "tag-danger"}`}>{c.status}</span></td>
                      <td style={{ display: "flex", gap: 6 }}>
                        {c.status === "DRAFT" && <button className="btn btn-sm btn-ghost" style={{ color: "var(--success)" }} onClick={() => handleCourseStatus(c.id, "ACTIVE")}>{t("activate")}</button>}
                        {c.status === "ACTIVE" && <button className="btn btn-sm btn-ghost" style={{ color: "var(--danger)" }} onClick={() => handleCourseStatus(c.id, "ARCHIVED")}>{t("archive")}</button>}
                      </td>
                    </tr>
                  ))}
                </tbody></table></div>
              )}
            </>
          )}

          {/* ── Resources ────────────────────────────────────── */}
          {section === "resources" && (
            <>
              <SectionHeader title={t("resourceTitle")} subtitle={t("resourceSubtitle")} />
              {resources.length === 0 ? <Empty msg={t("noResources")} /> : (
                <div className="table-wrap"><table className="table"><thead><tr>
                  <th>{t("colTitle")}</th><th>{t("colType")}</th><th>{t("colUpdated")}</th><th>{t("colStatus")}</th><th>{t("colActions")}</th>
                </tr></thead><tbody>
                  {resources.map((r) => (
                    <tr key={r.id} style={{ opacity: r.status === "ARCHIVED" ? 0.5 : 1 }}>
                      <td style={{ fontWeight: 600 }}>{r.title}</td>
                      <td>{r.type}</td><td>{r.updatedAt}</td>
                      <td><span className={`tag ${r.status === "ACTIVE" ? "tag-success" : "tag-muted"}`}>{r.status}</span></td>
                      <td>
                        {r.status === "ACTIVE" && (
                          <button className="btn btn-sm btn-ghost" onClick={() => handleResourceArchive(r.id)}>{t("archiveResource")}</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody></table></div>
              )}
            </>
          )}

          {/* ── Audit Log ────────────────────────────────────── */}
          {section === "audit" && (
            <>
              <SectionHeader title={t("auditTitle")} subtitle={t("auditSubtitle")} />
              {auditLog.length === 0 ? <Empty msg={t("noAudit")} /> : (
                <div className="table-wrap"><table className="table"><thead><tr>
                  <th>{t("colTime")}</th><th>{t("colActor")}</th><th>{t("colAction")}</th><th>{t("colTarget")}</th>
                </tr></thead><tbody>
                  {auditLog.map((entry) => (
                    <tr key={entry.id}>
                      <td style={{ fontFamily: "monospace", fontSize: "0.82rem" }}>{entry.time}</td>
                      <td style={{ fontWeight: 600 }}>{entry.actor}</td>
                      <td>{entry.action}</td>
                      <td>{entry.target}</td>
                    </tr>
                  ))}
                </tbody></table></div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Application Review Drawer ────────────────────────── */}
      {selectedApp && (
        <>
          <div className="drawer-overlay" onClick={() => setSelectedApp(null)} />
          <div className="drawer">
            <div className="drawer-header">
              <h2>{t("drawerTitle")}</h2>
              <button className="btn btn-sm btn-ghost" onClick={() => setSelectedApp(null)}>{t("close")}</button>
            </div>
            <div className="drawer-body">
              <div>
                <div className="detail-row"><span className="detail-label">{t("colApplicant")}</span><span className="detail-value">{selectedApp.name}</span></div>
                <div className="detail-row"><span className="detail-label">{t("colEmail")}</span><span className="detail-value">{selectedApp.email}</span></div>
                <div className="detail-row"><span className="detail-label">{t("colDepartment")}</span><span className="detail-value">{selectedApp.department}</span></div>
                <div className="detail-row"><span className="detail-label">{t("colStudentId")}</span><span className="detail-value">{selectedApp.studentId}</span></div>
                <div className="detail-row"><span className="detail-label">{t("colSubmitted")}</span><span className="detail-value">{selectedApp.date}</span></div>
                <div className="detail-row"><span className="detail-label">{t("colStatus")}</span><span className="detail-value"><span className={`status status-${selectedApp.status.toLowerCase().replace("_", "-")}`}>{ts(selectedApp.status)}</span></span></div>
              </div>
              <div>
                <h3 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: 8, color: "var(--text-300)" }}>{t("reason")}</h3>
                <p className="glass-card" style={{ padding: 16, fontSize: "0.88rem", lineHeight: 1.7, color: "var(--text-300)" }}>{selectedApp.reason}</p>
              </div>
              <div className="field">
                <label htmlFor="review-note">{t("reviewNote")}</label>
                <textarea id="review-note" rows={3} placeholder={t("reviewNotePlaceholder")} value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} />
              </div>
            </div>
            <div className="drawer-footer">
              <button className="btn btn-sm" style={{ background: "rgba(255,95,125,0.15)", color: "var(--danger)", border: "1px solid rgba(255,95,125,0.3)" }} onClick={() => handleAppAction("REJECTED")}>{t("reject")}</button>
              <button className="btn btn-sm" style={{ background: "rgba(47,128,255,0.15)", color: "var(--blue)", border: "1px solid rgba(47,128,255,0.3)" }} onClick={() => handleAppAction("NEEDS_INFO")}>{t("requestInfo")}</button>
              <button className="btn btn-sm" style={{ background: "rgba(33,214,162,0.15)", color: "var(--success)", border: "1px solid rgba(33,214,162,0.3)" }} onClick={() => handleAppAction("APPROVED")}>{t("approve")}</button>
            </div>
          </div>
        </>
      )}

      {/* ── Member Role Drawer ──────────────────────────────── */}
      {selectedMember && (
        <>
          <div className="drawer-overlay" onClick={() => setSelectedMember(null)} />
          <div className="drawer">
            <div className="drawer-header">
              <h2>{t("memberDetail")}</h2>
              <button className="btn btn-sm btn-ghost" onClick={() => setSelectedMember(null)}>{t("close")}</button>
            </div>
            <div className="drawer-body">
              <div>
                <div className="detail-row"><span className="detail-label">{t("colName")}</span><span className="detail-value">{selectedMember.name}</span></div>
                <div className="detail-row"><span className="detail-label">{t("colEmail")}</span><span className="detail-value">{selectedMember.email}</span></div>
                <div className="detail-row"><span className="detail-label">{t("colStudentId")}</span><span className="detail-value">{selectedMember.studentId}</span></div>
                <div className="detail-row"><span className="detail-label">{t("colDepartment")}</span><span className="detail-value">{selectedMember.department}</span></div>
                <div className="detail-row"><span className="detail-label">{t("colRole")}</span><span className="detail-value"><span className={`tag ${roleColors[selectedMember.role]}`}>{selectedMember.role}</span></span></div>
                <div className="detail-row"><span className="detail-label">{t("colJoined")}</span><span className="detail-value">{selectedMember.joinedAt}</span></div>
              </div>
              <div className="field">
                <label>{t("changeRole")}</label>
                <select value={selectedMember.role} onChange={(e) => { const newRole = e.target.value as Role; handleRoleChange(selectedMember.id, newRole); setSelectedMember({ ...selectedMember, role: newRole }); }}>
                  <option value="STUDENT">STUDENT</option>
                  <option value="MEMBER">MEMBER</option>
                  <option value="MAINTAINER">MAINTAINER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Toast ────────────────────────────────────────────── */}
      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
    </main>
  );
}

// ─── Shared Components ──────────────────────────────────────────────────────

function SectionHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: children ? "center" : "flex-start", marginBottom: 20, flexDirection: children ? "row" : "column", gap: 8 }}>
      <div>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700 }}>{title}</h2>
        {subtitle && <p style={{ color: "var(--text-500)", fontSize: "0.85rem", marginTop: 4 }}>{subtitle}</p>}
      </div>
      {children && <div style={{ display: "flex", gap: 8 }}>{children}</div>}
    </div>
  );
}

function Empty({ msg }: { msg: string }) {
  return <div className="glass-card" style={{ padding: 40, textAlign: "center" }}><p style={{ color: "var(--text-500)" }}>{msg}</p></div>;
}
