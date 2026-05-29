import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

export interface GitHubConnection {
  email: string;
  githubId: number;
  username: string;
  avatarUrl: string;
  profileUrl: string;
  connectedAt: string;
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
  return resolve(dataDir, "github-connections.json");
}

function readConnections(): GitHubConnection[] {
  try {
    const path = storePath();
    if (!existsSync(path)) return [];
    const data = JSON.parse(readFileSync(path, "utf8")) as unknown;
    return Array.isArray(data) ? data.filter(isGitHubConnection) : [];
  } catch {
    return [];
  }
}

function writeConnections(connections: GitHubConnection[]) {
  const path = storePath();
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(connections, null, 2));
}

function isGitHubConnection(value: unknown): value is GitHubConnection {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<GitHubConnection>;
  return (
    typeof record.email === "string" &&
    typeof record.githubId === "number" &&
    typeof record.username === "string" &&
    typeof record.avatarUrl === "string" &&
    typeof record.profileUrl === "string" &&
    typeof record.connectedAt === "string"
  );
}

export function getGitHubConnection(email: string): GitHubConnection | undefined {
  const key = email.trim().toLowerCase();
  return readConnections().find((connection) => connection.email.toLowerCase() === key);
}

export function saveGitHubConnection(connection: GitHubConnection): GitHubConnection {
  const key = connection.email.trim().toLowerCase();
  const connections = readConnections();
  writeConnections([
    { ...connection, email: key },
    ...connections.filter((item) => item.email.toLowerCase() !== key),
  ]);
  return { ...connection, email: key };
}

export function deleteGitHubConnection(email: string): GitHubConnection | undefined {
  const key = email.trim().toLowerCase();
  const connections = readConnections();
  const existing = connections.find((connection) => connection.email.toLowerCase() === key);
  if (!existing) return undefined;
  writeConnections(connections.filter((connection) => connection.email.toLowerCase() !== key));
  return existing;
}
