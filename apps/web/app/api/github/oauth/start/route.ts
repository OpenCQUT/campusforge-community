import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { loadServerConfig } from "@/lib/server-config";

function hasSession(request: Request): boolean {
  return /(?:^|;\s*)cf_session=/.test(request.headers.get("cookie") ?? "");
}

export async function GET(request: Request) {
  if (!hasSession(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const config = loadServerConfig();
  if (!config.github.clientId || !config.github.clientSecret) {
    return NextResponse.redirect(new URL("/zh/profile?github=oauth-not-configured", request.url));
  }

  const state = randomBytes(24).toString("hex");
  const callbackUrl = new URL("/api/github/oauth/callback", request.url).toString();
  const authorizeUrl = new URL("https://github.com/login/oauth/authorize");
  authorizeUrl.searchParams.set("client_id", config.github.clientId);
  authorizeUrl.searchParams.set("redirect_uri", callbackUrl);
  authorizeUrl.searchParams.set("scope", "read:user");
  authorizeUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set("cf_github_oauth_state", state, {
    httpOnly: true,
    maxAge: 10 * 60,
    path: "/",
    sameSite: "lax",
  });
  return response;
}
