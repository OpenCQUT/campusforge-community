import { NextResponse } from "next/server";
import {
  deleteGitHubConnection,
  getGitHubConnection,
} from "@/lib/github-connection-store";
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

  return NextResponse.json({ connection: getGitHubConnection(session.email) ?? null });
}

export async function DELETE(request: Request) {
  const config = loadServerConfig();
  const session = await getSessionFromRequest(
    request,
    getSessionSecret(config.app.sessionSecret, config.admin.password),
  );
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  deleteGitHubConnection(session.email);
  return NextResponse.json({ disconnected: true });
}
