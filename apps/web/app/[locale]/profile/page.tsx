"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getCourseProgress, type CourseProgress } from "@/lib/learning-store";

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
  totalPrs: number;
  totalIssues: number;
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

  const email = getSessionEmail() ?? "unknown";
  const role = getSessionRole() ?? "member";
  const displayName = getAccountName(email, role);



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

      // Fetch activity totals, contribution graph, and organization stats in parallel.
      const [contribRes, totalPrRes, totalIssueRes, openCqutPrRes, openCqutIssueRes, ...orgResults] = await Promise.all([
        fetch(`https://github-contributions-api.jogruber.de/v4/${username}?y=last`),
        fetch(`https://api.github.com/search/issues?q=author:${username}+type:pr&per_page=1`),
        fetch(`https://api.github.com/search/issues?q=author:${username}+type:issue&per_page=1`),
        fetch(`https://api.github.com/search/issues?q=author:${username}+type:pr+org:OpenCQUT&per_page=1`),
        fetch(`https://api.github.com/search/issues?q=author:${username}+type:issue+org:OpenCQUT&per_page=1`),
        ...majorOrgs.flatMap(org => [
          fetch(`https://api.github.com/search/issues?q=author:${username}+type:pr+org:${org}&per_page=1`),
          fetch(`https://api.github.com/search/issues?q=author:${username}+type:issue+org:${org}&per_page=1`),
        ]),
      ]);

      const contribData = contribRes.ok ? await contribRes.json() : { contributions: [], total: { lastYear: 0 } };
      const totalPrData = totalPrRes.ok ? await totalPrRes.json() : { total_count: 0 };
      const totalIssueData = totalIssueRes.ok ? await totalIssueRes.json() : { total_count: 0 };
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
        totalPrs: totalPrData.total_count ?? 0,
        totalIssues: totalIssueData.total_count ?? 0,
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
    <main className="page profile-page">
      <div className="page-header">
        <h1 className="page-title">{displayName}</h1>
        <p className="page-subtitle">{t("title")}</p>
      </div>

      <div className="profile-layout">
        {/* ── Account Info ────────────────────────────────────── */}
        <aside className="profile-sidebar">
          <div className="glass-card profile-card profile-identity-card">
            <div className="profile-avatar" aria-hidden="true">
              {displayName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h2>{t("accountInfo")}</h2>
              <p>{email}</p>
            </div>
            <div className="profile-detail-list">
              <Row label={t("email")} value={email} />
              <Row label={t("role")} value={<span className={`tag ${role === "admin" ? "tag-cyan" : "tag-blue"}`}>{role.toUpperCase()}</span>} />
            </div>
          </div>

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
        </aside>

        {/* ── GitHub ──────────────────────────────────────────── */}
        <section className="glass-card profile-card profile-github-card">
          <div className="profile-section-header">
            <div>
              <h2>{t("github")}</h2>
              <p>{t("githubOverview")}</p>
            </div>
            {ghUsername && (
              <button className="btn btn-ghost btn-sm" onClick={handleDisconnect}>{t("disconnect")}</button>
            )}
          </div>
          {!ghUsername ? (
            <div className="profile-connect-row">
              <input
                type="text"
                placeholder={t("githubPlaceholder")}
                value={ghInput}
                onChange={(e) => setGhInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleConnect()}
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
              <div className="profile-stat-row profile-github-total">
                <StatBlock label={t("totalContributions")} value={ghStats.totalContributions} />
                <StatBlock label={t("pullRequests")} value={ghStats.totalPrs} />
                <StatBlock label={t("issues")} value={ghStats.totalIssues} />
                {ghStats.orgStats
                  .filter((org) => org.prs > 0 || org.issues > 0)
                  .map((org) => (
                    <React.Fragment key={org.name}>
                      <StatBlock label={`${org.name} ${t("pullRequests")}`} value={org.prs} />
                      <StatBlock label={`${org.name} ${t("issues")}`} value={org.issues} />
                    </React.Fragment>
                  ))}
              </div>

              {/* Contribution graph */}
              <div className="profile-graph-panel">
                <ContributionGraph weeks={ghStats.contributionWeeks} />
              </div>

              {/* Major open source contributions */}
              {ghStats.ossContributions.length > 0 && (
                <div>
                  <h3 className="profile-subtitle">{t("ossContributions")}</h3>
                  <div className="profile-list">
                    {ghStats.ossContributions.map((org) => (
                      <div key={org.org} className="profile-list-row">
                        <span>{org.org}</span>
                        <div className="profile-inline-meta">
                          <span>{org.prs} PRs</span>
                          <span>{org.issues} Issues</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </section>
      </div>
    </main>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="profile-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

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
