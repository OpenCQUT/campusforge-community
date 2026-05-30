import { NextResponse } from "next/server";
import {
  getCachedGitHubProfile,
  isFreshGitHubProfileCache,
  saveGitHubProfileCache,
  type GitHubStats,
} from "@/lib/github-profile-cache-store";
import { githubFetch } from "@/lib/github-fetch";
import { logError } from "@/lib/app-logger";
import { loadServerConfig } from "@/lib/server-config";
import { getSessionFromRequest, getSessionSecret } from "@/lib/session";

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

async function fetchGitHubStats(config: ReturnType<typeof loadServerConfig>, username: string): Promise<GitHubStats> {
  const searchHeaders = { Accept: "application/vnd.github+json" };
  const [contribRes, prSearchRes, issueSearchRes, commitSearchRes] = await Promise.all([
    githubFetch(config, `https://github-contributions-api.jogruber.de/v4/${username}?y=last`),
    githubFetch(config, `https://api.github.com/search/issues?q=author:${username}+type:pr&per_page=100`, { headers: searchHeaders }),
    githubFetch(config, `https://api.github.com/search/issues?q=author:${username}+type:issue&per_page=100`, { headers: searchHeaders }),
    githubFetch(config, `https://api.github.com/search/commits?q=author:${username}&per_page=100`, { headers: searchHeaders }),
  ]);

  const contribData = await readJson<{
    contributions?: { date: string; count: number; level: number }[];
    total?: { lastYear?: number };
  }>(contribRes, { contributions: [], total: { lastYear: 0 } });

  const contributionWeeks: GitHubStats["contributionWeeks"] = [];
  const contributions = contribData.contributions ?? [];
  for (let index = 0; index < contributions.length; index += 7) {
    const weekDays = contributions.slice(index, index + 7);
    contributionWeeks.push({
      days: weekDays.map((day) => ({
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
      const response = await githubFetch(config, `https://api.github.com/repos/${repo.repo}`, { headers: searchHeaders });
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

  return {
    totalContributions: contribData.total?.lastYear ?? 0,
    totalPrs,
    totalIssues,
    totalCommits: commitData.total_count ?? 0,
    contributionWeeks,
    ossContributions,
  };
}

export async function GET(request: Request) {
  const config = loadServerConfig();
  const session = await getSessionFromRequest(
    request,
    getSessionSecret(config.app.sessionSecret, config.admin.password),
  );
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username")?.trim();
  if (!username) {
    return NextResponse.json({ error: "missing_username" }, { status: 400 });
  }

  const cached = getCachedGitHubProfile(username);
  if (cached && isFreshGitHubProfileCache(cached)) {
    return NextResponse.json({ ...cached, cached: true });
  }

  try {
    const stats = await fetchGitHubStats(config, username);
    const record = saveGitHubProfileCache(username, stats);
    return NextResponse.json({ ...record, cached: false });
  } catch {
    logError(config, "github.profile", "failed to fetch GitHub profile", {
      username,
    });
    if (cached) {
      return NextResponse.json({ ...cached, cached: true, stale: true });
    }
    return NextResponse.json({ error: "github_profile_fetch_failed" }, { status: 502 });
  }
}
