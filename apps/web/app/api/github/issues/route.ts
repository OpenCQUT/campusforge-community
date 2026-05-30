import { NextResponse } from "next/server";
import { loadServerConfig } from "@/lib/server-config";
import { getIssueClaims } from "@/lib/issue-claim-store";
import { githubFetch } from "@/lib/github-fetch";
import { getSessionFromRequest, getSessionSecret } from "@/lib/session";

interface GitHubSearchIssue {
  id: number;
  number: number;
  title: string;
  html_url: string;
  repository_url: string;
  state: string;
  comments: number;
  created_at: string;
  updated_at: string;
  labels: { name: string; color: string }[];
  assignees: { login: string }[];
  user: { login: string };
}

function repoFullName(repositoryUrl: string): string {
  return repositoryUrl.replace("https://api.github.com/repos/", "");
}

function githubHeaders(token?: string): HeadersInit {
  return {
    Accept: "application/vnd.github+json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    "X-GitHub-Api-Version": "2022-11-28",
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

  const org = config.github.org || "OpenCQUT";
  const query = encodeURIComponent(`org:${org} type:issue state:open`);
  const response = await githubFetch(
    config,
    `https://api.github.com/search/issues?q=${query}&sort=updated&order=desc&per_page=50`,
    {
      headers: githubHeaders(config.github.token),
      next: { revalidate: 60 },
    },
  );

  if (!response.ok) {
    return NextResponse.json(
      { error: "github_fetch_failed", status: response.status },
      { status: 502 },
    );
  }

  const data = await response.json() as { items?: GitHubSearchIssue[] };
  const claims = new Map(
    getIssueClaims().map((claim) => [
      `${claim.owner}/${claim.repo}#${claim.number}`.toLowerCase(),
      claim,
    ]),
  );
  const items = (data.items ?? []).map((issue) => {
    const fullName = repoFullName(issue.repository_url);
    const [owner = org, repo = fullName] = fullName.split("/");
    const claim = claims.get(`${owner}/${repo}#${issue.number}`.toLowerCase());
    return {
      id: String(issue.id),
      owner,
      repo,
      number: issue.number,
      title: issue.title,
      url: issue.html_url,
      state: issue.state,
      comments: issue.comments,
      createdAt: issue.created_at,
      updatedAt: issue.updated_at,
      labels: issue.labels.map((label) => ({ name: label.name, color: label.color })),
      assignees: issue.assignees.map((assignee) => assignee.login),
      claimedBy: claim?.claimedBy ?? null,
      claimedAt: claim?.claimedAt ?? null,
      remoteAssigned: claim?.remoteAssigned ?? issue.assignees.length > 0,
      author: issue.user.login,
    };
  });

  return NextResponse.json({ org, items });
}
