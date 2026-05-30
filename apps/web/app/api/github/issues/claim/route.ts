import { NextResponse } from "next/server";
import { loadServerConfig } from "@/lib/server-config";
import { deleteIssueClaim, findIssueClaim, saveIssueClaim } from "@/lib/issue-claim-store";
import { githubFetch } from "@/lib/github-fetch";
import { logError } from "@/lib/app-logger";
import { getSessionFromRequest, getSessionSecret, type SignedSession } from "@/lib/session";

interface ClaimBody {
  owner?: string;
  repo?: string;
  number?: number;
  assignee?: string;
  title?: string;
  url?: string;
}

function githubHeaders(token: string): HeadersInit {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

async function requireSession(request: Request): Promise<{
  config: ReturnType<typeof loadServerConfig>;
  session: SignedSession | null;
}> {
  const config = loadServerConfig();
  const session = await getSessionFromRequest(
    request,
    getSessionSecret(config.app.sessionSecret, config.admin.password),
  );
  return { config, session };
}

export async function POST(request: Request) {
  const { config, session } = await requireSession(request);
  if (!session) {
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
  const title = body.title?.trim();
  const url = body.url?.trim();

  if (!owner || !repo || !assignee || !Number.isInteger(number)) {
    return NextResponse.json({ error: "invalid_claim_request" }, { status: 400 });
  }
  const issueNumber = Number(number);

  const existingClaim = findIssueClaim(owner, repo, issueNumber);
  if (existingClaim) {
    return NextResponse.json({
      remoteAssigned: existingClaim.remoteAssigned,
      claimedBy: existingClaim.claimedBy,
      claimedAt: existingClaim.claimedAt,
      alreadyClaimed: true,
    }, { status: 409 });
  }

  const claimedByEmail = session.email;
  if (!config.github.token) {
    const claim = saveIssueClaim({
      id: `${owner}/${repo}#${issueNumber}`,
      owner,
      repo,
      number: issueNumber,
      title: title || `${owner}/${repo}#${issueNumber}`,
      url: url || `https://github.com/${owner}/${repo}/issues/${issueNumber}`,
      claimedBy: assignee,
      claimedByEmail,
      claimedAt: new Date().toISOString(),
      remoteAssigned: false,
    });

    return NextResponse.json({
      remoteAssigned: false,
      claimedBy: claim.claimedBy,
      claimedAt: claim.claimedAt,
      reason: "github_token_missing",
    }, { status: 202 });
  }

  const response = await githubFetch(
    config,
    `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}/assignees`,
    {
      method: "POST",
      headers: githubHeaders(config.github.token),
      body: JSON.stringify({ assignees: [assignee] }),
    },
  );

  if (!response.ok) {
    logError(config, "github.claim", "failed to assign GitHub issue", {
      owner,
      repo,
      number: issueNumber,
      status: response.status,
    });
    const claim = saveIssueClaim({
      id: `${owner}/${repo}#${issueNumber}`,
      owner,
      repo,
      number: issueNumber,
      title: title || `${owner}/${repo}#${issueNumber}`,
      url: url || `https://github.com/${owner}/${repo}/issues/${issueNumber}`,
      claimedBy: assignee,
      claimedByEmail,
      claimedAt: new Date().toISOString(),
      remoteAssigned: false,
    });

    return NextResponse.json({
      remoteAssigned: false,
      claimedBy: claim.claimedBy,
      claimedAt: claim.claimedAt,
      reason: "github_assign_failed",
      status: response.status,
    }, { status: 202 });
  }

  const claim = saveIssueClaim({
    id: `${owner}/${repo}#${issueNumber}`,
    owner,
    repo,
    number: issueNumber,
    title: title || `${owner}/${repo}#${issueNumber}`,
    url: url || `https://github.com/${owner}/${repo}/issues/${issueNumber}`,
    claimedBy: assignee,
    claimedByEmail,
    claimedAt: new Date().toISOString(),
    remoteAssigned: true,
  });

  return NextResponse.json({
    remoteAssigned: true,
    claimedBy: claim.claimedBy,
    claimedAt: claim.claimedAt,
  });
}

export async function DELETE(request: Request) {
  const { session } = await requireSession(request);
  if (!session) {
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
  if (!owner || !repo || !Number.isInteger(number)) {
    return NextResponse.json({ error: "invalid_claim_request" }, { status: 400 });
  }

  const issueNumber = Number(number);
  const existingClaim = findIssueClaim(owner, repo, issueNumber);
  if (!existingClaim) {
    return NextResponse.json({ cancelled: true, alreadyCancelled: true });
  }

  const actorEmail = session.email;
  const canCancel =
    session.role === "admin" ||
    (!!actorEmail && existingClaim.claimedByEmail === actorEmail) ||
    (!!assignee && existingClaim.claimedBy === assignee);

  if (!canCancel) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  deleteIssueClaim(owner, repo, issueNumber);
  return NextResponse.json({ cancelled: true });
}
