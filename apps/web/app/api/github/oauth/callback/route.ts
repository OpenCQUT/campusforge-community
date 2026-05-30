import { NextResponse } from "next/server";
import { saveGitHubConnection } from "@/lib/github-connection-store";
import { githubFetch } from "@/lib/github-fetch";
import { logError } from "@/lib/app-logger";
import { getPublicUrl } from "@/lib/public-url";
import { loadServerConfig } from "@/lib/server-config";
import { getSessionFromRequest, getSessionSecret } from "@/lib/session";

interface GitHubTokenResponse {
  access_token?: string;
  error?: string;
}

interface GitHubUserResponse {
  id?: number;
  login?: string;
  avatar_url?: string;
  html_url?: string;
}

function getCookie(request: Request, name: string): string {
  const match = (request.headers.get("cookie") ?? "").match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match?.[1] ? decodeURIComponent(match[1]) : "";
}

function redirectToProfile(request: Request, status: string): NextResponse {
  return NextResponse.redirect(new URL(`/zh/profile?github=${status}`, request.url));
}

export async function GET(request: Request) {
  const config = loadServerConfig();
  const session = await getSessionFromRequest(
    request,
    getSessionSecret(config.app.sessionSecret, config.admin.password),
  );
  if (!session) {
    return redirectToProfile(request, "unauthorized");
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const expectedState = getCookie(request, "cf_github_oauth_state");
  if (!code || !state || state !== expectedState) {
    return redirectToProfile(request, "state-invalid");
  }

  if (!config.github.clientId || !config.github.clientSecret) {
    return redirectToProfile(request, "oauth-not-configured");
  }

  const tokenResponse = await githubFetch(config, "https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: config.github.clientId,
      client_secret: config.github.clientSecret,
      code,
      redirect_uri: getPublicUrl(request, "/api/github/oauth/callback"),
      state,
    }),
  });
  const tokenData = await tokenResponse.json() as GitHubTokenResponse;
  if (!tokenResponse.ok || !tokenData.access_token || tokenData.error) {
    logError(config, "github.oauth", "failed to exchange GitHub OAuth token", {
      status: tokenResponse.status,
      hasError: Boolean(tokenData.error),
    });
    return redirectToProfile(request, "token-failed");
  }

  const userResponse = await githubFetch(config, "https://api.github.com/user", {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${tokenData.access_token}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  const userData = await userResponse.json() as GitHubUserResponse;
  if (!userResponse.ok || !userData.id || !userData.login) {
    logError(config, "github.oauth", "failed to fetch GitHub OAuth user", {
      status: userResponse.status,
    });
    return redirectToProfile(request, "user-failed");
  }

  saveGitHubConnection({
    email: session.email,
    githubId: userData.id,
    username: userData.login,
    avatarUrl: userData.avatar_url ?? "",
    profileUrl: userData.html_url ?? `https://github.com/${userData.login}`,
    connectedAt: new Date().toISOString(),
  });

  const response = redirectToProfile(request, "connected");
  response.cookies.set("cf_github_oauth_state", "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "lax",
  });
  return response;
}
