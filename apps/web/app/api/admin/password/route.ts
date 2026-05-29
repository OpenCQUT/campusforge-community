import { NextResponse } from "next/server";
import {
  getAdminPassword,
  passwordsMatch,
  setAdminPassword,
} from "@/lib/admin-password";
import { loadServerConfig } from "@/lib/server-config";
import { getSessionFromRequest, getSessionSecret } from "@/lib/session";

export const runtime = "nodejs";

interface RequestBody {
  currentPassword?: unknown;
  newPassword?: unknown;
}

export async function PUT(request: Request) {
  const config = loadServerConfig();
  const adminPassword = getAdminPassword(config);
  const session = await getSessionFromRequest(
    request,
    getSessionSecret(config.app.sessionSecret, adminPassword),
  );

  if (session?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (config.admin.password) {
    return NextResponse.json(
      { error: "Admin password is managed by config.toml." },
      { status: 409 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as RequestBody;
  const currentPassword =
    typeof body.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";

  if (!passwordsMatch(currentPassword, adminPassword)) {
    return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
  }

  if (newPassword.length < 12) {
    return NextResponse.json(
      { error: "New password must be at least 12 characters." },
      { status: 400 },
    );
  }

  setAdminPassword(config, newPassword);
  return NextResponse.json({ changed: true });
}
