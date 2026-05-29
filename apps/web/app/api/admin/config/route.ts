import { NextResponse } from "next/server";
import { getAdminPassword } from "@/lib/admin-password";
import {
  readRuntimeConfig,
  writeRuntimeConfig,
  type RuntimeConfig,
} from "@/lib/runtime-config";
import { loadServerConfig, type ServerConfig } from "@/lib/server-config";
import { getSessionFromRequest, getSessionSecret } from "@/lib/session";

export const runtime = "nodejs";

interface ConfigBody {
  email?: {
    mode?: unknown;
    from?: unknown;
    host?: unknown;
    port?: unknown;
    secure?: unknown;
    user?: unknown;
    pass?: unknown;
  };
  verification?: {
    codeTtlMinutes?: unknown;
    resendCooldownSeconds?: unknown;
  };
}

async function requireAdmin(request: Request): Promise<ServerConfig | NextResponse> {
  const config = loadServerConfig();
  const adminPassword = getAdminPassword(config);
  const session = await getSessionFromRequest(
    request,
    getSessionSecret(config.app.sessionSecret, adminPassword),
  );

  if (session?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  return config;
}

function publicConfig(config: ServerConfig) {
  return {
    email: {
      mode: config.email.mode,
      from: config.email.from,
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure,
      user: config.email.user,
      passConfigured: Boolean(config.email.pass),
    },
    verification: config.verification,
  };
}

function numberFrom(value: unknown, fallback: number): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function GET(request: Request) {
  const config = await requireAdmin(request);
  if (config instanceof NextResponse) return config;
  return NextResponse.json(publicConfig(config));
}

export async function PUT(request: Request) {
  const config = await requireAdmin(request);
  if (config instanceof NextResponse) return config;

  const body = (await request.json().catch(() => ({}))) as ConfigBody;
  const existingRuntime = readRuntimeConfig(config.storage.dataDir);
  const email = body.email ?? {};
  const verification = body.verification ?? {};
  const nextRuntime: RuntimeConfig = {
    ...existingRuntime,
    email: {
      ...existingRuntime.email,
      mode: email.mode === "smtp" ? "smtp" : "log",
      from: typeof email.from === "string" ? email.from.trim() : "",
      host: typeof email.host === "string" ? email.host.trim() : "",
      port: numberFrom(email.port, config.email.port),
      secure: Boolean(email.secure),
      user: typeof email.user === "string" ? email.user.trim() : "",
      pass:
        typeof email.pass === "string" && email.pass.length > 0
          ? email.pass
          : (existingRuntime.email?.pass ?? config.email.pass),
    },
    verification: {
      codeTtlMinutes: Math.max(
        1,
        numberFrom(verification.codeTtlMinutes, config.verification.codeTtlMinutes),
      ),
      resendCooldownSeconds: Math.max(
        10,
        numberFrom(
          verification.resendCooldownSeconds,
          config.verification.resendCooldownSeconds,
        ),
      ),
    },
  };

  writeRuntimeConfig(config.storage.dataDir, nextRuntime);
  return NextResponse.json(publicConfig(loadServerConfig()));
}
