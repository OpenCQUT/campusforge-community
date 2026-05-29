import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

export interface ContributionDay {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface ContributionWeek {
  days: ContributionDay[];
}

export interface GitHubStats {
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

export interface GitHubProfileCacheRecord {
  username: string;
  fetchedAt: string;
  stats: GitHubStats;
}

const GITHUB_PROFILE_TTL_MS = 30 * 60 * 1000;

function findWorkspaceRoot(): string {
  if (existsSync(resolve(process.cwd(), "pnpm-workspace.yaml"))) {
    return process.cwd();
  }

  const monorepoRoot = resolve(process.cwd(), "../..");
  if (existsSync(resolve(monorepoRoot, "pnpm-workspace.yaml"))) {
    return monorepoRoot;
  }

  return process.cwd();
}

function storePath(): string {
  const dataDir = process.env.CAMPUSFORGE_DATA_DIR
    ? resolve(process.env.CAMPUSFORGE_DATA_DIR)
    : resolve(findWorkspaceRoot(), ".campusforge-data");
  return resolve(dataDir, "github-profile-cache.json");
}

function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

function readRecords(): GitHubProfileCacheRecord[] {
  try {
    const path = storePath();
    if (!existsSync(path)) return [];
    const data = JSON.parse(readFileSync(path, "utf8")) as unknown;
    return Array.isArray(data) ? data.filter(isCacheRecord) : [];
  } catch {
    return [];
  }
}

function writeRecords(records: GitHubProfileCacheRecord[]) {
  const path = storePath();
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(records, null, 2));
}

function isCacheRecord(value: unknown): value is GitHubProfileCacheRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<GitHubProfileCacheRecord>;
  return (
    typeof record.username === "string" &&
    typeof record.fetchedAt === "string" &&
    typeof record.stats === "object" &&
    record.stats !== null
  );
}

export function getCachedGitHubProfile(username: string): GitHubProfileCacheRecord | undefined {
  const key = normalizeUsername(username);
  return readRecords().find((record) => normalizeUsername(record.username) === key);
}

export function isFreshGitHubProfileCache(record: GitHubProfileCacheRecord): boolean {
  return Date.now() - new Date(record.fetchedAt).getTime() < GITHUB_PROFILE_TTL_MS;
}

export function saveGitHubProfileCache(username: string, stats: GitHubStats): GitHubProfileCacheRecord {
  const record = {
    username: username.trim(),
    fetchedAt: new Date().toISOString(),
    stats,
  };
  const key = normalizeUsername(username);
  const records = readRecords();
  writeRecords([
    record,
    ...records.filter((item) => normalizeUsername(item.username) !== key),
  ]);
  return record;
}
