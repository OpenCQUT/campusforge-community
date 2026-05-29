"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getApplicationByEmail, type StoredApplication } from "@/lib/application-store";
import { getCourseProgress, type CourseProgress } from "@/lib/learning-store";
import { config } from "@/lib/config";

// ─── Session helpers ────────────────────────────────────────────────────────

function getAccountName(email: string): string {
  if (email.toLowerCase() === config.admin.email.toLowerCase()) return "Admin";
  return email.split("@")[0] ?? email;
}

const MOCK_DB: Record<string, StoredApplication> = {};

function getSessionEmail(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/cf_email=([^;]+)/);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}
function getSessionRole(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/cf_session=(\w+)/);
  return match?.[1] ?? null;
}

// ─── GitHub types ───────────────────────────────────────────────────────────

interface GitHubStats {
  commits: number;
  prs: number;
  issues: number;
  repos: { name: string; description: string; stars: number; language: string; url: string }[];
  recentActivity: { type: string; repo: string; date: string }[];
}


// ─── Component ──────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const t = useTranslations("profile");
  const ts = useTranslations("statusLabel");

  const email = getSessionEmail() ?? "unknown";
  const role = getSessionRole() ?? "member";
  const displayName = getAccountName(email);

  const application = getApplicationByEmail(email) ?? MOCK_DB[email] ?? null;

  // GitHub state
  const [ghUsername, setGhUsername] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("cf_github") ?? "";
  });
  const [ghInput, setGhInput] = useState(ghUsername);
  const [ghStats, setGhStats] = useState<GitHubStats | null>(null);
  const [ghLoading, setGhLoading] = useState(false);
  const [ghError, setGhError] = useState("");

  // Learning progress state
  const [courses, setCourses] = useState<CourseProgress[]>([]);

  useEffect(() => {
    setCourses(getCourseProgress());
  }, []);

  const fetchGitHub = useCallback(async (username: string) => {
    if (!username) return;
    setGhLoading(true);
    setGhError("");
    try {
      // Fetch PRs, Issues, and user repos in parallel
      const [prRes, issueRes, repoRes, eventRes] = await Promise.all([
        fetch(`https://api.github.com/search/issues?q=author:${username}+type:pr&per_page=1`),
        fetch(`https://api.github.com/search/issues?q=author:${username}+type:issue&per_page=1`),
        fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=5`),
        fetch(`https://api.github.com/users/${username}/events/public?per_page=10`),
      ]);

      const prData = prRes.ok ? await prRes.json() : { total_count: 0 };
      const issueData = issueRes.ok ? await issueRes.json() : { total_count: 0 };
      const repoData = repoRes.ok ? await repoRes.json() : [];
      const eventData = eventRes.ok ? await eventRes.json() : [];

      // Count commits from PushEvent
      let commitCount = 0;
      const recentActivity: GitHubStats["recentActivity"] = [];
      for (const event of eventData) {
        if (event.type === "PushEvent") {
          commitCount += event.payload?.commits?.length ?? 0;
        }
        recentActivity.push({
          type: event.type.replace("Event", ""),
          repo: event.repo?.name ?? "",
          date: event.created_at?.slice(0, 10) ?? "",
        });
      }

      const repos = Array.isArray(repoData)
        ? repoData.map((r: { name: string; description: string | null; stargazers_count: number; language: string | null; html_url: string }) => ({
            name: r.name,
            description: r.description ?? "",
            stars: r.stargazers_count,
            language: r.language ?? "",
            url: r.html_url,
          }))
        : [];

      setGhStats({
        commits: commitCount,
        prs: prData.total_count ?? 0,
        issues: issueData.total_count ?? 0,
        repos,
        recentActivity,
      });
    } catch {
      setGhError("Failed to fetch GitHub data.");
    } finally {
      setGhLoading(false);
    }
  }, []);

  // Fetch on mount if username exists
  useEffect(() => {
    if (ghUsername) fetchGitHub(ghUsername);
  }, [ghUsername, fetchGitHub]);

  function handleConnect() {
    const trimmed = ghInput.trim();
    if (!trimmed) return;
    setGhUsername(trimmed);
    localStorage.setItem("cf_github", trimmed);
  }

  function handleDisconnect() {
    setGhUsername("");
    setGhInput("");
    setGhStats(null);
    localStorage.removeItem("cf_github");
  }

  const startedCount = courses.length;
  const completedCount = courses.filter((c) => c.completedAt).length;

  return (
    <main className="page" style={{ maxWidth: 720, margin: "0 auto" }}>
      <div className="page-header">
        <h1 className="page-title">{displayName}</h1>
        <p className="page-subtitle">{t("title")}</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* ── Account Info ────────────────────────────────────── */}
        <div className="glass-card" style={{ padding: 28 }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: 16 }}>{t("accountInfo")}</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Row label={t("email")} value={email} />
            <Row label={t("role")} value={<span className={`tag ${role === "admin" ? "tag-cyan" : "tag-blue"}`}>{role.toUpperCase()}</span>} />
          </div>
        </div>

        {/* ── Application Status ──────────────────────────────── */}
        <div className="glass-card" style={{ padding: 28 }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: 16 }}>{t("myApplication")}</h2>
          {application ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Row label={t("role")} value={<span className={`status status-${application.status.toLowerCase().replace("_", "-")}`}>{ts(application.status)}</span>} />
              {application.submittedAt && <Row label="Submitted" value={application.submittedAt} />}
              {application.department && <Row label="Department" value={application.department} />}
              {application.reviewNote && <Row label="Review Note" value={application.reviewNote} />}
              <div style={{ marginTop: 8 }}><Link href="/status" className="btn btn-ghost btn-sm">{t("checkStatus")}</Link></div>
            </div>
          ) : (
            <div>
              <p style={{ color: "var(--text-500)", fontSize: "0.9rem", marginBottom: 16 }}>{t("noApplication")}</p>
              <Link href="/apply" className="btn btn-primary btn-sm">{t("applyNow")}</Link>
            </div>
          )}
        </div>

        {/* ── Learning Progress ───────────────────────────────── */}
        <div className="glass-card" style={{ padding: 28 }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: 16 }}>{t("learning")}</h2>
          {startedCount > 0 ? (
            <>
              <div style={{ display: "flex", gap: 24, marginBottom: 16 }}>
                <StatBlock label={t("coursesStarted")} value={startedCount} />
                <StatBlock label={t("coursesCompleted")} value={completedCount} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {courses.map((c) => (
                  <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(125,150,255,0.06)" }}>
                    <span style={{ fontSize: "0.88rem" }}>{c.title}</span>
                    {c.completedAt
                      ? <span className="tag tag-success" style={{ fontSize: "0.7rem" }}>Done</span>
                      : <span className="tag tag-blue" style={{ fontSize: "0.7rem" }}>In Progress</span>}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div>
              <p style={{ color: "var(--text-500)", fontSize: "0.9rem", marginBottom: 16 }}>{t("noCourses")}</p>
              <Link href="/courses" className="btn btn-ghost btn-sm">{t("viewAllCourses")}</Link>
            </div>
          )}
        </div>

        {/* ── GitHub ──────────────────────────────────────────── */}
        <div className="glass-card" style={{ padding: 28 }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: 16 }}>{t("github")}</h2>
          {!ghUsername ? (
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                placeholder={t("githubPlaceholder")}
                value={ghInput}
                onChange={(e) => setGhInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleConnect()}
                style={{ flex: 1, padding: "10px 14px", border: "1px solid var(--glass-border)", borderRadius: "var(--radius-sm)", background: "var(--bg-900)", color: "var(--text-100)", fontSize: "0.88rem" }}
              />
              <button className="btn btn-primary btn-sm" onClick={handleConnect}>{t("connect")}</button>
            </div>
          ) : ghLoading ? (
            <p style={{ color: "var(--text-500)", fontSize: "0.9rem" }}>{t("loading")}</p>
          ) : ghError ? (
            <div>
              <p style={{ color: "var(--danger)", fontSize: "0.88rem", marginBottom: 12 }}>{ghError}</p>
              <button className="btn btn-ghost btn-sm" onClick={handleDisconnect}>{t("disconnect")}</button>
            </div>
          ) : ghStats ? (
            <>
              {/* Stats row */}
              <div style={{ display: "flex", gap: 24, marginBottom: 20 }}>
                <StatBlock label={t("commits")} value={ghStats.commits} />
                <StatBlock label={t("pullRequests")} value={ghStats.prs} />
                <StatBlock label={t("issues")} value={ghStats.issues} />
              </div>

              {/* Top repos */}
              {ghStats.repos.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <h3 style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-500)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {t("topRepos")}
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {ghStats.repos.map((r) => (
                      <a key={r.name} href={r.url} target="_blank" rel="noopener noreferrer"
                        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--glass-border)", color: "var(--text-300)", fontSize: "0.85rem", transition: "border-color 0.15s" }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(125,150,255,0.3)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--glass-border)"; }}
                      >
                        <div>
                          <span style={{ fontWeight: 600 }}>{r.name}</span>
                          {r.language && <span className="tag tag-muted" style={{ fontSize: "0.68rem", marginLeft: 8 }}>{r.language}</span>}
                          {r.description && <p style={{ color: "var(--text-500)", fontSize: "0.78rem", margin: "4px 0 0" }}>{r.description}</p>}
                        </div>
                        <span style={{ fontSize: "0.78rem", color: "var(--text-500)", whiteSpace: "nowrap" }}>&#9733; {r.stars}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent activity */}
              {ghStats.recentActivity.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <h3 style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-500)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {t("activity")}
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {ghStats.recentActivity.slice(0, 5).map((a, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.82rem", color: "var(--text-300)" }}>
                        <span><span style={{ fontWeight: 600 }}>{a.type}</span> on {a.repo}</span>
                        <span style={{ color: "var(--text-500)", fontSize: "0.75rem" }}>{a.date}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button className="btn btn-ghost btn-sm" onClick={handleDisconnect}>{t("disconnect")}</button>
            </>
          ) : null}
        </div>
      </div>
    </main>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ color: "var(--text-500)", fontSize: "0.85rem" }}>{label}</span>
      <span style={{ fontSize: "0.88rem", fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function StatBlock({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div style={{ fontSize: "1.6rem", fontWeight: 800, lineHeight: 1, background: "linear-gradient(135deg, var(--purple), var(--cyan))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
        {value}
      </div>
      <div style={{ fontSize: "0.78rem", color: "var(--text-500)", marginTop: 4 }}>{label}</div>
    </div>
  );
}
