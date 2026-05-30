import { NextResponse } from "next/server";
import { getAdminPassword } from "@/lib/admin-password";
import { readRecentErrorLogs } from "@/lib/app-logger";
import { loadServerConfig } from "@/lib/server-config";
import { getSessionFromRequest, getSessionSecret } from "@/lib/session";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const config = loadServerConfig();
  const adminPassword = getAdminPassword(config);
  const session = await getSessionFromRequest(
    request,
    getSessionSecret(config.app.sessionSecret, adminPassword),
  );

  if (session?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  return NextResponse.json({
    errors: readRecentErrorLogs(config),
  });
}
