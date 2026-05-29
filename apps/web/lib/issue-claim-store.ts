import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

export interface IssueClaimRecord {
  id: string;
  owner: string;
  repo: string;
  number: number;
  title: string;
  url: string;
  claimedBy: string;
  claimedByEmail?: string;
  claimedAt: string;
  remoteAssigned: boolean;
}

function getIssueKey(owner: string, repo: string, number: number): string {
  return `${owner}/${repo}#${number}`.toLowerCase();
}

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
  return resolve(dataDir, "issue-claims.json");
}

function readClaims(): IssueClaimRecord[] {
  try {
    const path = storePath();
    if (!existsSync(path)) return [];
    const data = JSON.parse(readFileSync(path, "utf8")) as unknown;
    return Array.isArray(data) ? data.filter(isIssueClaimRecord) : [];
  } catch {
    return [];
  }
}

function writeClaims(claims: IssueClaimRecord[]) {
  const path = storePath();
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(claims, null, 2));
}

function isIssueClaimRecord(value: unknown): value is IssueClaimRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<IssueClaimRecord>;
  return (
    typeof record.id === "string" &&
    typeof record.owner === "string" &&
    typeof record.repo === "string" &&
    typeof record.number === "number" &&
    typeof record.title === "string" &&
    typeof record.url === "string" &&
    typeof record.claimedBy === "string" &&
    typeof record.claimedAt === "string" &&
    typeof record.remoteAssigned === "boolean"
  );
}

export function getIssueClaims(): IssueClaimRecord[] {
  return readClaims();
}

export function findIssueClaim(owner: string, repo: string, number: number): IssueClaimRecord | undefined {
  const key = getIssueKey(owner, repo, number);
  return readClaims().find((claim) => getIssueKey(claim.owner, claim.repo, claim.number) === key);
}

export function saveIssueClaim(claim: IssueClaimRecord): IssueClaimRecord {
  const key = getIssueKey(claim.owner, claim.repo, claim.number);
  const claims = readClaims();
  const existing = claims.find((item) => getIssueKey(item.owner, item.repo, item.number) === key);
  const nextClaim = existing
    ? { ...existing, ...claim, claimedAt: existing.claimedAt, remoteAssigned: existing.remoteAssigned || claim.remoteAssigned }
    : claim;

  writeClaims([
    nextClaim,
    ...claims.filter((item) => getIssueKey(item.owner, item.repo, item.number) !== key),
  ]);

  return nextClaim;
}

export function deleteIssueClaim(owner: string, repo: string, number: number): IssueClaimRecord | undefined {
  const key = getIssueKey(owner, repo, number);
  const claims = readClaims();
  const existing = claims.find((claim) => getIssueKey(claim.owner, claim.repo, claim.number) === key);
  if (!existing) return undefined;

  writeClaims(claims.filter((claim) => getIssueKey(claim.owner, claim.repo, claim.number) !== key));
  return existing;
}
