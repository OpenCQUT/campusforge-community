"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { getCourseProgress, type CourseProgress } from "@/lib/learning-store";
import { getClaimedIssueTasks, type ClaimedIssueTask } from "@/lib/issue-task-store";
import type { ContributionWeek, GitHubStats } from "@/lib/github-profile-cache-store";
import type { GitHubConnection } from "@/lib/github-connection-store";

// ─── Session helpers ────────────────────────────────────────────────────────

function getAccountName(email: string, role: string): string {
  if (role === "admin") return "Admin";
  return email.split("@")[0] ?? email;
}


function getSessionEmail(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/cf_email=([^;]+)/);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}
function getSessionRole(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/cf_role=(\w+)/);
  return match?.[1] ?? null;
}

// ─── GitHub types ───────────────────────────────────────────────────────────

// ─── Contribution Graph ────────────────────────────────────────────────────

const LEVEL_COLORS = [
  "var(--bg-800)",
  "rgba(125,150,255,0.2)",
  "rgba(125,150,255,0.4)",
  "rgba(125,150,255,0.6)",
  "rgba(125,150,255,0.8)",
];

function ContributionGraph({ weeks }: { weeks: ContributionWeek[] }) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = React.useState(0);

  React.useEffect(() => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.offsetWidth);
    }
    const handleResize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const gap = 2;
  const minCellSize = 8;
  const maxCellSize = 14;
  const cellSize = Math.max(minCellSize, Math.min(maxCellSize, Math.floor((containerWidth - (weeks.length - 1) * gap) / weeks.length)));
  const width = weeks.length * (cellSize + gap);
  const height = 7 * (cellSize + gap);

  return (
    <div ref={containerRef} style={{ width: "100%", overflowX: "auto", marginBottom: 16 }}>
      <svg width={width} height={height} style={{ display: "block" }}>
        {weeks.map((week, wi) =>
          week.days.map((day, di) => (
            <rect
              key={`${wi}-${di}`}
              x={wi * (cellSize + gap)}
              y={di * (cellSize + gap)}
              width={cellSize}
              height={cellSize}
              rx={2}
              fill={LEVEL_COLORS[day.level]}
            >
              <title>{`${day.date}: ${day.count} contributions`}</title>
            </rect>
          ))
        )}
      </svg>
    </div>
  );
}



// ─── Component ──────────────────────────────────────────────────────────────


export default function ProfilePage() {
  const t = useTranslations("profile");
  const searchParams = useSearchParams();

  const email = getSessionEmail() ?? "unknown";
  const role = getSessionRole() ?? "member";
  const displayName = getAccountName(email, role);



  // GitHub state
  const [ghConnection, setGhConnection] = useState<GitHubConnection | null>(null);
  const [ghStats, setGhStats] = useState<GitHubStats | null>(null);
  const [ghLoading, setGhLoading] = useState(false);
  const [ghError, setGhError] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [serverConfig, setServerConfig] = useState({
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
  });
  const [configStatus, setConfigStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  // Learning progress state
  const [courses, setCourses] = useState<CourseProgress[]>([]);
  const [issueTasks, setIssueTasks] = useState<ClaimedIssueTask[]>([]);

  useEffect(() => {
    setCourses(getCourseProgress());
    setIssueTasks(getClaimedIssueTasks());
  }, []);

  useEffect(() => {
    async function loadConnection() {
      try {
        const response = await fetch("/api/github/connection");
        if (!response.ok) return;
        const data = await response.json() as { connection: GitHubConnection | null };
        setGhConnection(data.connection);
      } catch {
        setGhConnection(null);
      }
    }

    loadConnection();
  }, []);

  useEffect(() => {
    async function loadServerConfig() {
      if (role !== "admin") return;
      const response = await fetch("/api/admin/config");
      if (!response.ok) return;
      const config = await response.json() as typeof serverConfig;
      setServerConfig({
        ...config,
        email: {
          ...config.email,
          pass: "",
        },
      });
    }

    loadServerConfig();
  }, [role]);

  const fetchGitHub = useCallback(async (username: string) => {
    if (!username) return;
    setGhLoading(true);
    setGhError("");
    try {
      const response = await fetch(`/api/github/profile?username=${encodeURIComponent(username)}`);
      if (!response.ok) throw new Error("failed");
      const data = await response.json() as { stats: GitHubStats };
      setGhStats(data.stats);
    } catch {
      setGhError("Failed to fetch GitHub data.");
    } finally {
      setGhLoading(false);
    }
  }, []);


  // Fetch on mount if username exists
  useEffect(() => {
    if (ghConnection) fetchGitHub(ghConnection.username);
  }, [ghConnection, fetchGitHub]);

  async function handleDisconnect() {
    await fetch("/api/github/connection", { method: "DELETE" });
    setGhConnection(null);
    setGhStats(null);
  }

  function handleGitHubConnect() {
    window.location.assign("/api/github/oauth/start");
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPasswordStatus("saving");
    const response = await fetch("/api/admin/password", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    if (!response.ok) {
      setPasswordStatus("error");
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setPasswordStatus("saved");
  }

  async function handleConfigSave(e: React.FormEvent) {
    e.preventDefault();
    setConfigStatus("saving");
    const response = await fetch("/api/admin/config", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(serverConfig),
    });

    if (!response.ok) {
      setConfigStatus("error");
      return;
    }

    const config = await response.json() as typeof serverConfig;
    setServerConfig({
      ...config,
      email: {
        ...config.email,
        pass: "",
      },
    });
    setConfigStatus("saved");
  }

  function updateEmailConfig(field: keyof typeof serverConfig.email, value: string | boolean | number) {
    setServerConfig((current) => ({
      ...current,
      email: {
        ...current.email,
        [field]: value,
      },
    }));
  }

  function updateVerificationConfig(
    field: keyof typeof serverConfig.verification,
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

  const startedCount = courses.length;
  const completedCount = courses.filter((c) => c.completedAt).length;
  const githubStatus = searchParams.get("github");

  return (
    <main className="page profile-page">
      <section className="glass-card profile-summary-card">
        <div className="profile-summary-identity">
          <div className="profile-avatar profile-avatar-large" aria-hidden="true">
            {displayName.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h1>{displayName}</h1>
            <p>{email}</p>
            <div className="profile-summary-tags">
              <span className={`tag ${role === "admin" ? "tag-cyan" : "tag-blue"}`}>{role.toUpperCase()}</span>
              <span className={`tag ${ghConnection ? "tag-success" : "tag-muted"}`}>
                {ghConnection ? `@${ghConnection.username}` : t("githubNotConnected")}
              </span>
            </div>
          </div>
        </div>
        <div className="profile-summary-stats">
          <SummaryStat label={t("coursesStarted")} value={startedCount} />
          <SummaryStat label={t("coursesCompleted")} value={completedCount} />
          <SummaryStat label={t("activeTasks")} value={issueTasks.length} />
        </div>
      </section>

      <div className="profile-layout">
        {/* ── GitHub ──────────────────────────────────────────── */}
        <section className="glass-card profile-card profile-github-card">
          <div className="profile-section-header">
            <div>
              <h2>{t("github")}</h2>
              <p>{t("githubOverview")}</p>
            </div>
            {ghConnection && (
              <button className="btn btn-ghost btn-sm" onClick={handleDisconnect}>{t("disconnect")}</button>
            )}
          </div>
          {!ghConnection ? (
            <div className="profile-github-empty">
              <div className="profile-github-empty-mark" aria-hidden="true">GH</div>
              <div>
                {githubStatus === "oauth-not-configured" && (
                  <p style={{ color: "var(--danger)", fontSize: "0.88rem", marginBottom: 10 }}>{t("githubOauthNotConfigured")}</p>
                )}
                <h3>{t("githubVerifyTitle")}</h3>
                <p className="profile-muted">{t("githubConnectHint")}</p>
              </div>
              <button className="btn btn-primary btn-sm" onClick={handleGitHubConnect}>{t("connectGitHub")}</button>
              <p className="profile-muted">{t("githubOauthNote")}</p>
            </div>
          ) : ghLoading ? (
            <p style={{ color: "var(--text-500)", fontSize: "0.9rem" }}>{t("loading")}</p>
          ) : ghError ? (
            <div>
              <p style={{ color: "var(--danger)", fontSize: "0.88rem", marginBottom: 12 }}>{ghError}</p>
              <button className="btn btn-ghost btn-sm" onClick={handleDisconnect}>{t("disconnect")}</button>
            </div>
          ) : ghStats ? (
            <div className="profile-github-content">
              <a className="profile-github-account" href={ghConnection.profileUrl} target="_blank" rel="noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {ghConnection.avatarUrl && <img src={ghConnection.avatarUrl} alt="" />}
                <span>
                  <strong>@{ghConnection.username}</strong>
                  <small>{t("githubConnected")}</small>
                </span>
              </a>
              <div className="profile-stat-row profile-github-total">
                <StatBlock label={t("totalContributions")} value={ghStats.totalContributions} />
                <StatBlock label={t("pullRequests")} value={ghStats.totalPrs} />
                <StatBlock label={t("issues")} value={ghStats.totalIssues} />
                <StatBlock label={t("commits")} value={ghStats.totalCommits} />
              </div>

              <div className="profile-graph-panel">
                <ContributionGraph weeks={ghStats.contributionWeeks} />
              </div>

              {ghStats.ossContributions.length > 0 && (
                <div className="profile-repo-section">
                  <h3 className="profile-subtitle">{t("popularRepos")}</h3>
                  <div className="profile-list profile-repo-scroll">
                    {ghStats.ossContributions.map((repo) => (
                      <a key={repo.repo} className="profile-list-row profile-repo-row" href={repo.url} target="_blank" rel="noreferrer">
                        <span>
                          {repo.repo}
                          <small>{repo.isOpenCqut ? "OpenCQUT" : `${repo.stars.toLocaleString()} ${t("stars")}`}</small>
                        </span>
                        <div className="profile-inline-meta">
                          {repo.prs > 0 && <span>{repo.prs} PRs</span>}
                          {repo.issues > 0 && <span>{repo.issues} Issues</span>}
                          {repo.commits > 0 && <span>{repo.commits} Commits</span>}
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </section>

        <aside className="profile-sidebar">
          {role === "admin" && (
            <>
              <div className="glass-card profile-card">
                <h2>{t("security")}</h2>
                <form onSubmit={handlePasswordChange} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div className="field">
                    <label htmlFor="current-password">{t("currentPassword")}</label>
                    <input
                      id="current-password"
                      type="password"
                      value={currentPassword}
                      onChange={(event) => setCurrentPassword(event.target.value)}
                      required
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="new-password">{t("newPassword")}</label>
                    <input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      minLength={12}
                      required
                    />
                  </div>
                  {passwordStatus === "saved" && (
                    <p style={{ color: "var(--success)", fontSize: "0.82rem", margin: 0 }}>
                      {t("passwordChanged")}
                    </p>
                  )}
                  {passwordStatus === "error" && (
                    <p style={{ color: "var(--danger)", fontSize: "0.82rem", margin: 0 }}>
                      {t("passwordChangeFailed")}
                    </p>
                  )}
                  <button className="btn btn-primary btn-sm" type="submit" disabled={passwordStatus === "saving"}>
                    {passwordStatus === "saving" ? t("saving") : t("changePassword")}
                  </button>
                </form>
              </div>

              <div className="glass-card profile-card">
                <h2>{t("serverConfig")}</h2>
                <form onSubmit={handleConfigSave} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div className="field">
                    <label htmlFor="email-mode">{t("emailMode")}</label>
                    <select
                      id="email-mode"
                      value={serverConfig.email.mode}
                      onChange={(event) => updateEmailConfig("mode", event.target.value)}
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
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="email-host">{t("emailHost")}</label>
                    <input
                      id="email-host"
                      value={serverConfig.email.host}
                      onChange={(event) => updateEmailConfig("host", event.target.value)}
                      placeholder="smtp.example.com"
                    />
                  </div>
                  <div className="form-row">
                    <div className="field">
                      <label htmlFor="email-port">{t("emailPort")}</label>
                      <input
                        id="email-port"
                        type="number"
                        value={serverConfig.email.port}
                        onChange={(event) => updateEmailConfig("port", Number(event.target.value))}
                      />
                    </div>
                    <label className="field" htmlFor="email-secure">
                      {t("emailSecure")}
                      <input
                        id="email-secure"
                        type="checkbox"
                        checked={serverConfig.email.secure}
                        onChange={(event) => updateEmailConfig("secure", event.target.checked)}
                      />
                    </label>
                  </div>
                  <div className="field">
                    <label htmlFor="email-user">{t("emailUser")}</label>
                    <input
                      id="email-user"
                      value={serverConfig.email.user}
                      onChange={(event) => updateEmailConfig("user", event.target.value)}
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
                    />
                  </div>
                  <div className="form-row">
                    <div className="field">
                      <label htmlFor="code-ttl">{t("codeTtl")}</label>
                      <input
                        id="code-ttl"
                        type="number"
                        value={serverConfig.verification.codeTtlMinutes}
                        onChange={(event) => updateVerificationConfig("codeTtlMinutes", Number(event.target.value))}
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="resend-cooldown">{t("resendCooldown")}</label>
                      <input
                        id="resend-cooldown"
                        type="number"
                        value={serverConfig.verification.resendCooldownSeconds}
                        onChange={(event) => updateVerificationConfig("resendCooldownSeconds", Number(event.target.value))}
                      />
                    </div>
                  </div>
                  {configStatus === "saved" && (
                    <p style={{ color: "var(--success)", fontSize: "0.82rem", margin: 0 }}>
                      {t("configSaved")}
                    </p>
                  )}
                  {configStatus === "error" && (
                    <p style={{ color: "var(--danger)", fontSize: "0.82rem", margin: 0 }}>
                      {t("configSaveFailed")}
                    </p>
                  )}
                  <button className="btn btn-primary btn-sm" type="submit" disabled={configStatus === "saving"}>
                    {configStatus === "saving" ? t("saving") : t("saveConfig")}
                  </button>
                </form>
              </div>
            </>
          )}

          <div className="glass-card profile-card">
            <h2>{t("learning")}</h2>
            {startedCount > 0 ? (
              <>
                <div className="profile-stat-row">
                  <StatBlock label={t("coursesStarted")} value={startedCount} />
                  <StatBlock label={t("coursesCompleted")} value={completedCount} />
                </div>
                <div className="profile-list">
                  {courses.map((c) => (
                    <div key={c.id} className="profile-list-row">
                      <span>{c.title}</span>
                      {c.completedAt
                        ? <span className="tag tag-success">Done</span>
                        : <span className="tag tag-blue">In Progress</span>}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div>
                <p className="profile-muted">{t("noCourses")}</p>
                <Link href="/courses" className="btn btn-ghost btn-sm">{t("viewAllCourses")}</Link>
              </div>
            )}
          </div>

          <div className="glass-card profile-card">
            <h2>{t("activeTasks")}</h2>
            {issueTasks.length > 0 ? (
              <div className="profile-list profile-task-list">
                {issueTasks.map((task) => (
                  <a key={task.id} href={task.url} target="_blank" rel="noreferrer" className="profile-task-row">
                    <span className="profile-task-title">{task.title}</span>
                    <span className="profile-task-meta">
                      <small>{task.owner}/{task.repo} #{task.number}</small>
                      <span className={`tag ${task.remoteAssigned ? "tag-success" : "tag-blue"}`}>
                        {task.remoteAssigned ? t("assignedOnGitHub") : t("localTask")}
                      </span>
                    </span>
                  </a>
                ))}
              </div>
            ) : (
              <div>
                <p className="profile-muted">{t("noActiveTasks")}</p>
                <Link href="/issues" className="btn btn-ghost btn-sm">{t("browseIssues")}</Link>
              </div>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function StatBlock({ label, value }: { label: string; value: number }) {
  return (
    <div className="profile-stat">
      <div>
        {value}
      </div>
      <span>{label}</span>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="profile-summary-stat">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}
