import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { getPublicUrl } from "@/lib/public-url";
import { loadServerConfig } from "@/lib/server-config";
import { getSessionFromRequest, getSessionSecret } from "@/lib/session";

export async function GET(request: Request) {
  const config = loadServerConfig();
  const session = await getSessionFromRequest(
    request,
    getSessionSecret(config.app.sessionSecret, config.admin.password),
  );
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!config.github.clientId || !config.github.clientSecret) {
    return NextResponse.redirect(new URL("/zh/profile?github=oauth-not-configured", request.url));
  }

  const state = randomBytes(24).toString("hex");
  const callbackUrl = getPublicUrl(request, "/api/github/oauth/callback");
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
