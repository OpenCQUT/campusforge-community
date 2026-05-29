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
  totalCommits: number;
  contributionWeeks: ContributionWeek[];
  ossContributions: {
    repo: string;
    owner: string;
    url: string;
    stars: number;
    prs: number;
    issues: number;
    commits: number;
    isOpenCqut: boolean;
  }[];

}

interface GitHubSearchItem {
  repository_url?: string;
}

interface GitHubCommitSearchItem {
  repository?: {
    full_name?: string;
    html_url?: string;
    stargazers_count?: number;
    owner?: {
      login?: string;
    };
  };
}

interface GitHubRepo {
  full_name: string;
  html_url: string;
  stargazers_count: number;
  owner: {
    login: string;
  };
}

interface RepoContribution {
  repo: string;
  owner: string;
  url: string;
  stars: number;
  prs: number;
  issues: number;
  commits: number;
  isOpenCqut: boolean;
}

function getRepoFullName(repositoryUrl?: string): string | null {
  if (!repositoryUrl) return null;
  const marker = "/repos/";
  const markerIndex = repositoryUrl.indexOf(marker);
  if (markerIndex === -1) return null;
  return repositoryUrl.slice(markerIndex + marker.length);
}

async function readJson<T>(response: Response, fallback: T): Promise<T> {
  if (!response.ok) return fallback;
  return response.json() as Promise<T>;
}

async function addIssueSearchResults(
  target: Map<string, RepoContribution>,
  response: Response,
  kind: "prs" | "issues",
) {
  const data = await readJson<{ total_count?: number; items?: GitHubSearchItem[] }>(response, { total_count: 0, items: [] });
  for (const item of data.items ?? []) {
    const fullName = getRepoFullName(item.repository_url);
    if (!fullName) continue;
    const existing = target.get(fullName) ?? {
      repo: fullName,
      owner: fullName.split("/")[0] ?? "",
      url: `https://github.com/${fullName}`,
      stars: 0,
      prs: 0,
      issues: 0,
      commits: 0,
      isOpenCqut: fullName.toLowerCase().startsWith("opencqut/"),
    };
    existing[kind] += 1;
    target.set(fullName, existing);
  }
  return data.total_count ?? 0;
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
      const searchHeaders = { Accept: "application/vnd.github+json" };
      const [contribRes, prSearchRes, issueSearchRes, commitSearchRes] = await Promise.all([
        fetch(`https://github-contributions-api.jogruber.de/v4/${username}?y=last`),
        fetch(`https://api.github.com/search/issues?q=author:${username}+type:pr&per_page=100`, { headers: searchHeaders }),
        fetch(`https://api.github.com/search/issues?q=author:${username}+type:issue&per_page=100`, { headers: searchHeaders }),
        fetch(`https://api.github.com/search/commits?q=author:${username}&per_page=100`, { headers: searchHeaders }),
      ]);

      const contribData = contribRes.ok ? await contribRes.json() : { contributions: [], total: { lastYear: 0 } };

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

      const repoContributions = new Map<string, RepoContribution>();
      const [totalPrs, totalIssues, commitData] = await Promise.all([
        addIssueSearchResults(repoContributions, prSearchRes, "prs"),
        addIssueSearchResults(repoContributions, issueSearchRes, "issues"),
        readJson<{ total_count?: number; items?: GitHubCommitSearchItem[] }>(commitSearchRes, { total_count: 0, items: [] }),
      ]);

      for (const item of commitData.items ?? []) {
        const repo = item.repository;
        const fullName = repo?.full_name;
        if (!fullName) continue;
        const existing = repoContributions.get(fullName) ?? {
          repo: fullName,
          owner: repo.owner?.login ?? fullName.split("/")[0] ?? "",
          url: repo.html_url ?? `https://github.com/${fullName}`,
          stars: repo.stargazers_count ?? 0,
          prs: 0,
          issues: 0,
          commits: 0,
          isOpenCqut: fullName.toLowerCase().startsWith("opencqut/"),
        };
        existing.commits += 1;
        existing.stars = Math.max(existing.stars, repo.stargazers_count ?? 0);
        repoContributions.set(fullName, existing);
      }

      const reposNeedingStars = [...repoContributions.values()].filter((repo) => repo.stars === 0);
      const repoDetailResults = await Promise.all(
        reposNeedingStars.slice(0, 80).map(async (repo) => {
          const response = await fetch(`https://api.github.com/repos/${repo.repo}`, { headers: searchHeaders });
          return readJson<GitHubRepo | null>(response, null);
        }),
      );

      for (const repoDetail of repoDetailResults) {
        if (!repoDetail?.full_name) continue;
        const existing = repoContributions.get(repoDetail.full_name);
        if (!existing) continue;
        existing.owner = repoDetail.owner.login;
        existing.url = repoDetail.html_url;
        existing.stars = repoDetail.stargazers_count;
        existing.isOpenCqut = repoDetail.owner.login.toLowerCase() === "opencqut";
      }

      const ossContributions = [...repoContributions.values()]
        .filter((repo) => repo.stars >= 1000 || repo.isOpenCqut)
        .sort((a, b) => {
          if (a.isOpenCqut !== b.isOpenCqut) return a.isOpenCqut ? -1 : 1;
          if (b.stars !== a.stars) return b.stars - a.stars;
          return (b.prs + b.issues + b.commits) - (a.prs + a.issues + a.commits);
        });

      setGhStats({
        totalContributions: contribData.total?.lastYear ?? 0,
        totalPrs,
        totalIssues,
        totalCommits: commitData.total_count ?? 0,
        contributionWeeks,
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
                <StatBlock label={t("commits")} value={ghStats.totalCommits} />
              </div>

              {/* Contribution graph */}
              <div className="profile-graph-panel">
                <ContributionGraph weeks={ghStats.contributionWeeks} />
              </div>

              {/* Major open source contributions */}
              {ghStats.ossContributions.length > 0 && (
                <div>
                  <h3 className="profile-subtitle">{t("popularRepos")}</h3>
                  <div className="profile-list">
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
