import { NextResponse } from "next/server";
import { loadServerConfig } from "@/lib/server-config";
import { createSessionCookieValue, getSessionSecret } from "@/lib/session";

interface LoginBody {
  email?: unknown;
  password?: unknown;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as LoginBody;
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const serverConfig = loadServerConfig();
  const admin = serverConfig.admin;

  if (!admin.email || !admin.password) {
    return NextResponse.json(
      { error: "Admin account is not configured." },
      { status: 503 },
    );
  }

  if (email !== admin.email.toLowerCase() || password !== admin.password) {
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 },
    );
  }

  const sessionSecret = getSessionSecret(
    serverConfig.app.sessionSecret,
    serverConfig.admin.password,
  );
  const sessionCookie = await createSessionCookieValue(email, "admin", sessionSecret);
  const response = NextResponse.json({ role: "admin" });
  response.cookies.set("cf_session", sessionCookie, {
    httpOnly: true,
    maxAge: 60 * 60 * 24,
    path: "/",
    sameSite: "lax",
  });
  response.cookies.set("cf_role", "admin", {
    httpOnly: false,
    maxAge: 60 * 60 * 24,
    path: "/",
    sameSite: "lax",
  });
  response.cookies.set("cf_email", email, {
    httpOnly: false,
    maxAge: 60 * 60 * 24,
    path: "/",
    sameSite: "lax",
  });

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ signedOut: true });
  for (const name of ["cf_session", "cf_role", "cf_email", "cf_github_oauth_state"]) {
    response.cookies.set(name, "", {
      httpOnly: name === "cf_session" || name === "cf_github_oauth_state",
      maxAge: 0,
      path: "/",
      sameSite: "lax",
    });
  }
  return response;
}
