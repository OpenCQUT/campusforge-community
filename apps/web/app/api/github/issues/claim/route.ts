import { NextResponse } from "next/server";
import { loadServerConfig } from "@/lib/server-config";

interface ClaimBody {
  owner?: string;
  repo?: string;
  number?: number;
  assignee?: string;
}

function githubHeaders(token: string): HeadersInit {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

function hasSession(request: Request): boolean {
  return /(?:^|;\s*)cf_session=/.test(request.headers.get("cookie") ?? "");
}

export async function POST(request: Request) {
  if (!hasSession(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: ClaimBody;
  try {
    body = await request.json() as ClaimBody;
  } catch {
    return NextResponse.json({ error: "invalid_claim_request" }, { status: 400 });
  }
  const owner = body.owner?.trim();
  const repo = body.repo?.trim();
  const assignee = body.assignee?.trim();
  const number = body.number;

  if (!owner || !repo || !assignee || !Number.isInteger(number)) {
    return NextResponse.json({ error: "invalid_claim_request" }, { status: 400 });
  }

  const config = loadServerConfig();
  if (!config.github.token) {
    return NextResponse.json({
      remoteAssigned: false,
      reason: "github_token_missing",
    }, { status: 202 });
  }

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/issues/${number}/assignees`,
    {
      method: "POST",
      headers: githubHeaders(config.github.token),
      body: JSON.stringify({ assignees: [assignee] }),
    },
  );

  if (!response.ok) {
    return NextResponse.json({
      remoteAssigned: false,
      reason: "github_assign_failed",
      status: response.status,
    }, { status: 502 });
  }

  return NextResponse.json({ remoteAssigned: true });
}
