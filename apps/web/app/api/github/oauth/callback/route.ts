import { NextResponse } from "next/server";
import { saveGitHubConnection } from "@/lib/github-connection-store";
import { loadServerConfig } from "@/lib/server-config";

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
  const email = getCookie(request, "cf_email");
  const session = getCookie(request, "cf_session");
  if (!email || !session) {
    return redirectToProfile(request, "unauthorized");
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const expectedState = getCookie(request, "cf_github_oauth_state");
  if (!code || !state || state !== expectedState) {
    return redirectToProfile(request, "state-invalid");
  }

  const config = loadServerConfig();
  if (!config.github.clientId || !config.github.clientSecret) {
    return redirectToProfile(request, "oauth-not-configured");
  }

  const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: config.github.clientId,
      client_secret: config.github.clientSecret,
      code,
      redirect_uri: new URL("/api/github/oauth/callback", request.url).toString(),
      state,
    }),
  });
  const tokenData = await tokenResponse.json() as GitHubTokenResponse;
  if (!tokenResponse.ok || !tokenData.access_token || tokenData.error) {
    return redirectToProfile(request, "token-failed");
  }

  const userResponse = await fetch("https://api.github.com/user", {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${tokenData.access_token}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  const userData = await userResponse.json() as GitHubUserResponse;
  if (!userResponse.ok || !userData.id || !userData.login) {
    return redirectToProfile(request, "user-failed");
  }

  saveGitHubConnection({
    email,
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
