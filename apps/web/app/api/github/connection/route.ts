import { NextResponse } from "next/server";
import {
  deleteGitHubConnection,
  getGitHubConnection,
} from "@/lib/github-connection-store";

function getCookie(request: Request, name: string): string {
  const match = (request.headers.get("cookie") ?? "").match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match?.[1] ? decodeURIComponent(match[1]) : "";
}

export async function GET(request: Request) {
  const email = getCookie(request, "cf_email");
  if (!email || !getCookie(request, "cf_session")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ connection: getGitHubConnection(email) ?? null });
}

export async function DELETE(request: Request) {
  const email = getCookie(request, "cf_email");
  if (!email || !getCookie(request, "cf_session")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  deleteGitHubConnection(email);
  return NextResponse.json({ disconnected: true });
}
