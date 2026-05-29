"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getCourseProgress, type CourseProgress } from "@/lib/learning-store";

import { config } from "@/lib/config";


// ─── Session helpers ────────────────────────────────────────────────────────

function getAccountName(email: string): string {
  if (email.toLowerCase() === config.admin.email.toLowerCase()) return "Admin";
  return email.split("@")[0] ?? email;
}


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

interface ContributionDay {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

interface ContributionWeek {
  days: ContributionDay[];
}

interface GitHubStats {
  totalContributions: number;
  contributionWeeks: ContributionWeek[];
  orgStats: {
    name: string;
    prs: number;
    issues: number;
  }[];
  ossContributions: {
    org: string;
    prs: number;
    issues: number;
  }[];

}


// ─── Contribution Graph ────────────────────────────────────────────────────

const LEVEL_COLORS = [
  "var(--bg-800)",
  "rgba(125,150,255,0.2)",
  "rgba(125,150,255,0.4)",
  "rgba(125,150,255,0.6)",
  "rgba(125,150,255,0.8)",
];

function ContributionGraph({ weeks }: { weeks: ContributionWeek[] }) {
  const cellSize = 12;
  const gap = 2;
  const width = weeks.length * (cellSize + gap);
  const height = 7 * (cellSize + gap);

  return (
    <div style={{ overflowX: "auto", marginBottom: 16 }}>
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

  const email = getSessionEmail() ?? "unknown";
  const role = getSessionRole() ?? "member";
  const displayName = getAccountName(email);



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
      // Major open source organizations to track
      const majorOrgs = ["facebook", "microsoft", "google", "apache", "vercel", "nextui-org", "shadcn-ui"];

      // Fetch contributions and org stats in parallel
      const [contribRes, openCqutPrRes, openCqutIssueRes, ...orgResults] = await Promise.all([
        fetch(`https://github-contributions-api.jogruber.de/v4/${username}?y=last`),
        fetch(`https://api.github.com/search/issues?q=author:${username}+type:pr+org:OpenCQUT&per_page=1`),
        fetch(`https://api.github.com/search/issues?q=author:${username}+type:issue+org:OpenCQUT&per_page=1`),
        ...majorOrgs.flatMap(org => [
          fetch(`https://api.github.com/search/issues?q=author:${username}+type:pr+org:${org}&per_page=1`),
          fetch(`https://api.github.com/search/issues?q=author:${username}+type:issue+org:${org}&per_page=1`),
        ]),
      ]);

      const contribData = contribRes.ok ? await contribRes.json() : { contributions: [], total: { lastYear: 0 } };
      const openCqutPrData = openCqutPrRes.ok ? await openCqutPrRes.json() : { total_count: 0 };
      const openCqutIssueData = openCqutIssueRes.ok ? await openCqutIssueRes.json() : { total_count: 0 };

      // Parse contribution weeks from the API response
      const contributionWeeks: ContributionWeek[] = [];
      const contributions = contribData.contributions ?? [];
      for (let i = 0; i < contributions.length; i += 7) {
        const weekDays = contributions.slice(i, i + 7);
        contributionWeeks.push({
          days: weekDays.map((day: { date: string; count: number; level: number }) => ({
            date: day.date,
            count: day.count,
            level: Math.min(4, Math.max(0, day.level)) as 0 | 1 | 2 | 3 | 4,
          })),
        });
      }

      // Parse major org contributions
      const ossContributions: GitHubStats["ossContributions"] = [];
      for (let i = 0; i < majorOrgs.length; i++) {

        const org = majorOrgs[i]!;
        const prRes = orgResults[i * 2];
        const issueRes = orgResults[i * 2 + 1];
        const prData = prRes?.ok ? await prRes.json() : { total_count: 0 };
        const issueData = issueRes?.ok ? await issueRes.json() : { total_count: 0 };
        const prs = prData.total_count ?? 0;
        const issues = issueData.total_count ?? 0;
        if (prs > 0 || issues > 0) {
          ossContributions.push({ org, prs, issues });
        }
      }

      setGhStats({
        totalContributions: contribData.total?.lastYear ?? 0,
        contributionWeeks,
        orgStats: [{
          name: "OpenCQUT",
          prs: openCqutPrData.total_count ?? 0,
          issues: openCqutIssueData.total_count ?? 0,
        }],
        ossContributions,
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
              {/* Total contributions */}
              <div style={{ marginBottom: 20 }}>
                <StatBlock label={t("totalContributions")} value={ghStats.totalContributions} />
              </div>

              {/* Contribution graph */}
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-500)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {t("contributionGraph")}
                </h3>
                <ContributionGraph weeks={ghStats.contributionWeeks} />
              </div>

              {/* OpenCQUT contributions */}
              {ghStats.orgStats.length > 0 && ghStats.orgStats.some(o => o.prs > 0 || o.issues > 0) && (
                <div style={{ marginBottom: 20 }}>
                  <h3 style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-500)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {t("openCqutContributions")}
                  </h3>
                  <div style={{ display: "flex", gap: 24 }}>
                    {ghStats.orgStats.map((org) => (
                      <div key={org.name} style={{ display: "flex", gap: 24 }}>
                        <StatBlock label={t("pullRequests")} value={org.prs} />
                        <StatBlock label={t("issues")} value={org.issues} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Major open source contributions */}
              {ghStats.ossContributions.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <h3 style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-500)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {t("ossContributions")}
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {ghStats.ossContributions.map((org) => (
                      <div key={org.org} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--glass-border)" }}>
                        <span style={{ fontWeight: 600, fontSize: "0.88rem" }}>{org.org}</span>
                        <div style={{ display: "flex", gap: 16 }}>
                          <span style={{ fontSize: "0.82rem", color: "var(--text-500)" }}>{org.prs} PRs</span>
                          <span style={{ fontSize: "0.82rem", color: "var(--text-500)" }}>{org.issues} Issues</span>
                        </div>
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
