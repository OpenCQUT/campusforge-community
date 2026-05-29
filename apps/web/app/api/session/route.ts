import { NextResponse } from "next/server";
import { loadServerConfig } from "@/lib/server-config";

interface LoginBody {
  email?: unknown;
  password?: unknown;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as LoginBody;
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const admin = loadServerConfig().admin;

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

  const response = NextResponse.json({ role: "admin" });
  response.cookies.set("cf_session", "admin", {
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
