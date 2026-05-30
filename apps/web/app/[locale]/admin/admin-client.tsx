"use client";

import { useState, useCallback, useEffect, type FormEvent, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { getAllApplications, updateApplication, type StoredApplication } from "@/lib/application-store";
import { config } from "@/lib/config";

// ─── Types ──────────────────────────────────────────────────────────────────

type AppStatus = "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "NEEDS_INFO";
type Role = "STUDENT" | "MEMBER" | "MAINTAINER" | "ADMIN";
type CourseStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";
type Section = "applications" | "members" | "invitations" | "courses" | "resources" | "settings" | "audit";
type ConfigStatus = "idle" | "loading" | "saving" | "saved" | "error";

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
interface ServerConfigForm {
  admin: {
    email: string;
    emails: string[];
    passwordManagedByFile: boolean;
  };
  github: {
    org: string;
    token: string;
    tokenConfigured: boolean;
    clientId: string;
    clientSecret: string;
    clientSecretConfigured: boolean;
    proxy: string;
    proxyConfigured: boolean;
  };
  app: {
    debug: boolean;
    sessionSecretConfigured: boolean;
  };
  storage: {
    dataDir: string;
    logDir: string;
  };
  email: {
    mode: string;
    from: string;
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
    passConfigured: boolean;
  };
  verification: {
    codeTtlMinutes: number;
    resendCooldownSeconds: number;
  };
}

const defaultServerConfig: ServerConfigForm = {
  admin: {
    email: "",
    emails: [],
    passwordManagedByFile: false,
  },
  github: {
    org: "OpenCQUT",
    token: "",
    tokenConfigured: false,
    clientId: "",
    clientSecret: "",
    clientSecretConfigured: false,
    proxy: "",
    proxyConfigured: false,
  },
  app: {
    debug: false,
    sessionSecretConfigured: false,
  },
  storage: {
    dataDir: "",
    logDir: "",
  },
  email: {
    mode: "log",
    from: "",
    host: "",
    port: 587,
    secure: false,
    user: "",
    pass: "",
    passConfigured: false,
  },
  verification: {
    codeTtlMinutes: 10,
    resendCooldownSeconds: 60,
  },
};

// ─── Mock Data Factories ────────────────────────────────────────────────────

function applicationsData(): Application[] {
  return [];
}

function membersData(locale: string): Member[] {
  const isAdmin = locale === "zh";
  const email = config.admin.email || "admin@example.com";
  return [
    { id: "m1", name: isAdmin ? "管理员" : "Admin", email, studentId: "-", department: "-", role: "ADMIN", joinedAt: "2025-01-01" },
  ];
}
function invitationsData(): Invitation[] {
  return [];
}

function coursesData(): CourseItem[] {
  return [];
}

function resourcesData(): ResourceItem[] {
  return [];
}

function auditData(): AuditEntry[] {
  return [];
}

// ─── Role colors ────────────────────────────────────────────────────────────

const roleColors: Record<Role, string> = {
  STUDENT: "tag-muted", MEMBER: "tag-blue", MAINTAINER: "tag-purple", ADMIN: "tag-cyan",
};

function isReviewableStatus(status: AppStatus): boolean {
  return status === "SUBMITTED" || status === "UNDER_REVIEW";
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function AdminPage() {
  const t = useTranslations("admin");
  const ts = useTranslations("statusLabel");
  const tc = useTranslations("common");
  const locale = useLocale();

  const [section, setSection] = useState<Section>("applications");
  const [toast, setToast] = useState<{ type: string; msg: string } | null>(null);
  const [serverConfig, setServerConfig] = useState<ServerConfigForm>(defaultServerConfig);
  const [configStatus, setConfigStatus] = useState<ConfigStatus>("idle");

  const showToast = useCallback((type: string, msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 2500);
  }, []);

  // Data state — merge shared store (new submissions) with mock data
  const [applications, setApplications] = useState<Application[]>(() => {
    const stored = getAllApplications().map((a: StoredApplication) => ({
      id: a.id, name: a.name, email: a.email, studentId: a.studentId,
      department: a.department, reason: a.reason, status: a.status, date: a.submittedAt, reviewNote: a.reviewNote,
    }));
    const mock = applicationsData();
    // Deduplicate by email
    const mockFiltered = mock.filter((m) => !stored.some((s) => s.email.toLowerCase() === m.email.toLowerCase()));
    return [...stored, ...mockFiltered];
  });
  const [members, setMembers] = useState(() => membersData(locale));
  const [invitations, setInvitations] = useState(() => invitationsData());
  const [courses, setCourses] = useState(() => coursesData());
  const [resources, setResources] = useState(() => resourcesData());
  const [auditLog, setAuditLog] = useState(() => auditData());

  // Applications state
  const [appFilter, setAppFilter] = useState<string>("ALL");
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [reviewNote, setReviewNote] = useState("");

  // Members state
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  useEffect(() => {
    async function loadServerConfig() {
      setConfigStatus("loading");
      try {
        const response = await fetch("/api/admin/config");
        if (!response.ok) throw new Error("failed");
        const nextConfig = await response.json() as ServerConfigForm;
        setServerConfig({
          ...nextConfig,
          github: {
            ...nextConfig.github,
            token: "",
            clientSecret: "",
            proxy: "",
          },
          email: {
            ...nextConfig.email,
            pass: "",
          },
        });
        setConfigStatus("idle");
      } catch {
        setConfigStatus("error");
      }
    }

    loadServerConfig();
  }, []);

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
    if (!isReviewableStatus(selectedApp.status)) return;
    const label = status === "APPROVED" ? t("approved") : status === "REJECTED" ? t("rejected") : t("infoRequested");
    setApplications((prev) => prev.map((a) => a.id === selectedApp.id ? { ...a, status, reviewNote } : a));
    updateApplication(selectedApp.id, { status, reviewNote });
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

  async function handleConfigSave(e: FormEvent) {
    e.preventDefault();
    setConfigStatus("saving");
    const response = await fetch("/api/admin/config", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(serverConfig),
    });

    if (!response.ok) {
      setConfigStatus("error");
      showToast("danger", t("configSaveFailed"));
      return;
    }

    const nextConfig = await response.json() as ServerConfigForm;
    setServerConfig({
      ...nextConfig,
      github: {
        ...nextConfig.github,
        token: "",
        clientSecret: "",
        proxy: "",
      },
      email: {
        ...nextConfig.email,
        pass: "",
      },
    });
    setConfigStatus("saved");
    showToast("success", t("configSaved"));
  }

  function updateEmailConfig(field: keyof ServerConfigForm["email"], value: string | boolean | number) {
    setServerConfig((current) => ({
      ...current,
      email: {
        ...current.email,
        [field]: value,
      },
    }));
  }

  function updateAdminConfig(field: keyof ServerConfigForm["admin"], value: string | string[] | boolean) {
    setServerConfig((current) => ({
      ...current,
      admin: {
        ...current.admin,
        [field]: value,
      },
    }));
  }

  function updateGitHubConfig(field: keyof ServerConfigForm["github"], value: string | boolean) {
    setServerConfig((current) => ({
      ...current,
      github: {
        ...current.github,
        [field]: value,
      },
    }));
  }

  function updateAppConfig(field: keyof ServerConfigForm["app"], value: boolean) {
    setServerConfig((current) => ({
      ...current,
      app: {
        ...current.app,
        [field]: value,
      },
    }));
  }

  function updateVerificationConfig(
    field: keyof ServerConfigForm["verification"],
    value: number,
  ) {
    setServerConfig((current) => ({
      ...current,
      verification: {
        ...current.verification,
        [field]: value,
      },
    }));
  }

  // Sidebar config
  const sidebarItems: { key: Section; label: string }[] = [
    { key: "applications", label: t("navApplications") },
    { key: "members", label: t("navMembers") },
    { key: "invitations", label: t("navInvitations") },
    { key: "courses", label: t("navCourses") },
    { key: "resources", label: t("navResources") },
    { key: "settings", label: t("navSettings") },
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
    <main className="page page-fixed admin-page">
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

        <div className={`admin-main ${section === "settings" ? "admin-main-fixed" : ""}`}>
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
                      <td>
                        <button className="btn btn-sm btn-ghost" onClick={() => { setSelectedApp(a); setReviewNote(a.reviewNote); }}>
                          {isReviewableStatus(a.status) ? tc("review") : t("viewReview")}
                        </button>
                      </td>
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

          {/* ── Settings ─────────────────────────────────────── */}
          {section === "settings" && (
            <div className="admin-settings-panel">
              <SectionHeader title={t("settingsTitle")} subtitle={t("settingsSubtitle")} />
              <form className="admin-config-form" onSubmit={handleConfigSave}>
                <div className="admin-config-grid">
                  <ConfigSection title={t("adminSettingsTitle")} subtitle={t("adminSettingsSubtitle")}>
                    <div className="field">
                      <label htmlFor="admin-email">{t("adminEmail")}</label>
                      <input
                        id="admin-email"
                        value={serverConfig.admin.email}
                        onChange={(event) => updateAdminConfig("email", event.target.value)}
                        placeholder="admin@example.edu"
                        disabled={configStatus === "loading"}
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="admin-emails">{t("adminEmails")}</label>
                      <textarea
                        id="admin-emails"
                        rows={3}
                        value={serverConfig.admin.emails.join("\n")}
                        onChange={(event) => updateAdminConfig(
                          "emails",
                          event.target.value
                            .split(/[\n,]/)
                            .map((item) => item.trim())
                            .filter(Boolean),
                        )}
                        placeholder="admin@example.edu"
                        disabled={configStatus === "loading"}
                      />
                    </div>
                    <ReadOnlyField label={t("adminPasswordMode")} value={serverConfig.admin.passwordManagedByFile ? t("passwordFileManaged") : t("passwordConfigManaged")} />
                  </ConfigSection>

                  <ConfigSection title={t("githubSettingsTitle")} subtitle={t("githubSettingsSubtitle")}>
                    <div className="field">
                      <label htmlFor="github-org">{t("githubOrg")}</label>
                      <input
                        id="github-org"
                        value={serverConfig.github.org}
                        onChange={(event) => updateGitHubConfig("org", event.target.value)}
                        disabled={configStatus === "loading"}
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="github-token">{t("githubToken")}</label>
                      <input
                        id="github-token"
                        type="password"
                        value={serverConfig.github.token}
                        onChange={(event) => updateGitHubConfig("token", event.target.value)}
                        placeholder={serverConfig.github.tokenConfigured ? t("secretConfigured") : ""}
                        disabled={configStatus === "loading"}
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="github-client-id">{t("githubClientId")}</label>
                      <input
                        id="github-client-id"
                        value={serverConfig.github.clientId}
                        onChange={(event) => updateGitHubConfig("clientId", event.target.value)}
                        disabled={configStatus === "loading"}
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="github-client-secret">{t("githubClientSecret")}</label>
                      <input
                        id="github-client-secret"
                        type="password"
                        value={serverConfig.github.clientSecret}
                        onChange={(event) => updateGitHubConfig("clientSecret", event.target.value)}
                        placeholder={serverConfig.github.clientSecretConfigured ? t("secretConfigured") : ""}
                        disabled={configStatus === "loading"}
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="github-proxy">{t("githubProxy")}</label>
                      <input
                        id="github-proxy"
                        type="password"
                        value={serverConfig.github.proxy}
                        onChange={(event) => updateGitHubConfig("proxy", event.target.value)}
                        placeholder={serverConfig.github.proxyConfigured ? t("secretConfigured") : t("notConfigured")}
                        disabled={configStatus === "loading"}
                      />
                    </div>
                  </ConfigSection>

                  <ConfigSection title={t("emailSettingsTitle")} subtitle={t("emailSettingsSubtitle")}>
                  <div className="field">
                    <label htmlFor="email-mode">{t("emailMode")}</label>
                    <select
                      id="email-mode"
                      value={serverConfig.email.mode}
                      onChange={(event) => updateEmailConfig("mode", event.target.value)}
                      disabled={configStatus === "loading"}
                    >
                      <option value="smtp">smtp</option>
                      <option value="log">log</option>
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor="email-from">{t("emailFrom")}</label>
                    <input
                      id="email-from"
                      value={serverConfig.email.from}
                      onChange={(event) => updateEmailConfig("from", event.target.value)}
                      placeholder="Name <name@example.com>"
                      disabled={configStatus === "loading"}
                    />
                  </div>
                  <div className="form-row">
                    <div className="field">
                      <label htmlFor="email-host">{t("emailHost")}</label>
                      <input
                        id="email-host"
                        value={serverConfig.email.host}
                        onChange={(event) => updateEmailConfig("host", event.target.value)}
                        placeholder="smtp.example.com"
                        disabled={configStatus === "loading"}
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="email-port">{t("emailPort")}</label>
                      <input
                        id="email-port"
                        type="number"
                        value={serverConfig.email.port}
                        onChange={(event) => updateEmailConfig("port", Number(event.target.value))}
                        disabled={configStatus === "loading"}
                      />
                    </div>
                  </div>
                  <div className="field">
                    <label htmlFor="email-user">{t("emailUser")}</label>
                    <input
                      id="email-user"
                      value={serverConfig.email.user}
                      onChange={(event) => updateEmailConfig("user", event.target.value)}
                      disabled={configStatus === "loading"}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="email-pass">{t("emailPass")}</label>
                    <input
                      id="email-pass"
                      type="password"
                      value={serverConfig.email.pass}
                      onChange={(event) => updateEmailConfig("pass", event.target.value)}
                      placeholder={serverConfig.email.passConfigured ? t("secretConfigured") : ""}
                      disabled={configStatus === "loading"}
                    />
                  </div>
                  <label className="admin-checkbox" htmlFor="email-secure">
                    <input
                      id="email-secure"
                      type="checkbox"
                      checked={serverConfig.email.secure}
                      onChange={(event) => updateEmailConfig("secure", event.target.checked)}
                      disabled={configStatus === "loading"}
                    />
                    <span>{t("emailSecure")}</span>
                  </label>
                </ConfigSection>

                  <ConfigSection title={t("verificationSettingsTitle")} subtitle={t("verificationSettingsSubtitle")}>
                  <div className="form-row">
                    <div className="field">
                      <label htmlFor="code-ttl">{t("codeTtl")}</label>
                      <input
                        id="code-ttl"
                        type="number"
                        min={1}
                        value={serverConfig.verification.codeTtlMinutes}
                        onChange={(event) => updateVerificationConfig("codeTtlMinutes", Number(event.target.value))}
                        disabled={configStatus === "loading"}
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="resend-cooldown">{t("resendCooldown")}</label>
                      <input
                        id="resend-cooldown"
                        type="number"
                        min={10}
                        value={serverConfig.verification.resendCooldownSeconds}
                        onChange={(event) => updateVerificationConfig("resendCooldownSeconds", Number(event.target.value))}
                        disabled={configStatus === "loading"}
                      />
                    </div>
                  </div>
                </ConfigSection>

                  <ConfigSection title={t("appSettingsTitle")} subtitle={t("appSettingsSubtitle")}>
                    <label className="admin-checkbox" htmlFor="app-debug">
                      <input
                        id="app-debug"
                        type="checkbox"
                        checked={serverConfig.app.debug}
                        onChange={(event) => updateAppConfig("debug", event.target.checked)}
                        disabled={configStatus === "loading"}
                      />
                      <span>{t("debugMode")}</span>
                    </label>
                    <ReadOnlyField label={t("sessionSecret")} value={serverConfig.app.sessionSecretConfigured ? t("configured") : t("notConfigured")} />
                  </ConfigSection>

                  <ConfigSection title={t("storageSettingsTitle")} subtitle={t("storageSettingsSubtitle")}>
                    <div className="admin-readonly-grid">
                      <ReadOnlyField label={t("dataDir")} value={serverConfig.storage.dataDir || "-"} />
                      <ReadOnlyField label={t("logDir")} value={serverConfig.storage.logDir || "-"} />
                    </div>
                  </ConfigSection>
                </div>

                <div className="admin-config-footer">
                  {configStatus === "error" && (
                    <p className="admin-settings-status admin-settings-status-error">
                      {t("configSaveFailed")}
                    </p>
                  )}
                  {configStatus === "saved" && (
                    <p className="admin-settings-status admin-settings-status-success">
                      {t("configSaved")}
                    </p>
                  )}
                  <button className="btn btn-primary btn-sm" type="submit" disabled={configStatus === "saving" || configStatus === "loading"}>
                    {configStatus === "saving" ? t("saving") : t("saveConfig")}
                  </button>
                </div>
              </form>
            </div>
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
                <textarea
                  id="review-note"
                  rows={3}
                  placeholder={t("reviewNotePlaceholder")}
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  disabled={!isReviewableStatus(selectedApp.status)}
                />
              </div>
            </div>
            {isReviewableStatus(selectedApp.status) ? (
              <div className="drawer-footer">
                <button className="btn btn-sm" style={{ background: "rgba(255,95,125,0.15)", color: "var(--danger)", border: "1px solid rgba(255,95,125,0.3)" }} onClick={() => handleAppAction("REJECTED")}>{t("reject")}</button>
                <button className="btn btn-sm" style={{ background: "rgba(47,128,255,0.15)", color: "var(--blue)", border: "1px solid rgba(47,128,255,0.3)" }} onClick={() => handleAppAction("NEEDS_INFO")}>{t("requestInfo")}</button>
                <button className="btn btn-sm" style={{ background: "rgba(33,214,162,0.15)", color: "var(--success)", border: "1px solid rgba(33,214,162,0.3)" }} onClick={() => handleAppAction("APPROVED")}>{t("approve")}</button>
              </div>
            ) : (
              <div className="drawer-footer">
                <p style={{ color: "var(--text-500)", fontSize: "0.85rem", marginRight: "auto" }}>
                  {t("reviewFinalized")}
                </p>
                <button className="btn btn-sm btn-ghost" onClick={() => setSelectedApp(null)}>{t("close")}</button>
              </div>
            )}
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

function SectionHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
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

function ConfigSection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <details className="glass-card admin-config-card">
      <summary className="admin-config-summary">
        <span>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </span>
      </summary>
      <div className="admin-config-card-body">
        {children}
      </div>
    </details>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="admin-readonly-field">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
