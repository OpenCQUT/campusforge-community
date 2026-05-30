import { NextResponse } from "next/server";
import { getAdminPassword } from "@/lib/admin-password";
import {
  readRuntimeConfig,
  writeRuntimeConfig,
  type RuntimeConfig,
} from "@/lib/runtime-config";
import { logInfo } from "@/lib/app-logger";
import { loadServerConfig, type ServerConfig } from "@/lib/server-config";
import { getSessionFromRequest, getSessionSecret } from "@/lib/session";

export const runtime = "nodejs";

interface ConfigBody {
  admin?: {
    email?: unknown;
    emails?: unknown;
  };
  github?: {
    org?: unknown;
    token?: unknown;
    clientId?: unknown;
    clientSecret?: unknown;
    proxy?: unknown;
  };
  app?: {
    debug?: unknown;
  };
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
  logging?: {
    level?: unknown;
    retentionDays?: unknown;
    maxFileMb?: unknown;
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
    admin: {
      email: config.admin.email,
      emails: config.admin.emails,
      passwordManagedByFile: !config.admin.password,
    },
    github: {
      org: config.github.org,
      token: "",
      tokenConfigured: Boolean(config.github.token),
      clientId: config.github.clientId,
      clientSecret: "",
      clientSecretConfigured: Boolean(config.github.clientSecret),
      proxy: config.github.proxy ? "<configured>" : "",
      proxyConfigured: Boolean(config.github.proxy),
    },
    app: {
      debug: config.app.debug,
      sessionSecretConfigured: Boolean(config.app.sessionSecret),
    },
    storage: config.storage,
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
    logging: config.logging,
  };
}

function numberFrom(value: unknown, fallback: number): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function stringFrom(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function stringListFrom(value: unknown, fallback: string[]): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item.trim().toLowerCase() : ""))
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/[\n,]/)
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);
  }

  return fallback;
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
  const admin = body.admin ?? {};
  const github = body.github ?? {};
  const app = body.app ?? {};
  const email = body.email ?? {};
  const verification = body.verification ?? {};
  const logging = body.logging ?? {};
  const adminEmail = stringFrom(admin.email).toLowerCase();
  const adminEmails = Array.from(
    new Set([
      ...stringListFrom(admin.emails, existingRuntime.admin?.emails ?? config.admin.emails),
      adminEmail,
    ].filter(Boolean)),
  );
  const nextRuntime: RuntimeConfig = {
    ...existingRuntime,
    admin: {
      ...existingRuntime.admin,
      email: adminEmail || config.admin.email,
      emails: adminEmails.length > 0 ? adminEmails : config.admin.emails,
    },
    github: {
      ...existingRuntime.github,
      org: stringFrom(github.org) || config.github.org,
      token:
        typeof github.token === "string" && github.token.length > 0
          ? github.token
          : (existingRuntime.github?.token ?? config.github.token),
      clientId: stringFrom(github.clientId),
      clientSecret:
        typeof github.clientSecret === "string" && github.clientSecret.length > 0
          ? github.clientSecret
          : (existingRuntime.github?.clientSecret ?? config.github.clientSecret),
      proxy:
        typeof github.proxy === "string" && github.proxy.length > 0
          ? github.proxy.trim()
          : (existingRuntime.github?.proxy ?? config.github.proxy),
    },
    app: {
      ...existingRuntime.app,
      debug: Boolean(app.debug),
    },
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
    logging: {
      level:
        logging.level === "debug" ||
        logging.level === "warn" ||
        logging.level === "error"
          ? logging.level
          : "info",
      retentionDays: Math.max(
        1,
        numberFrom(logging.retentionDays, config.logging.retentionDays),
      ),
      maxFileMb: Math.max(
        1,
        numberFrom(logging.maxFileMb, config.logging.maxFileMb),
      ),
    },
  };

  writeRuntimeConfig(config.storage.dataDir, nextRuntime);
  logInfo(config, "admin.config", "runtime configuration saved", {
    adminEmails: adminEmails.length,
    emailMode: nextRuntime.email?.mode ?? null,
    logLevel: nextRuntime.logging?.level ?? null,
    logRetentionDays: nextRuntime.logging?.retentionDays ?? null,
  });
  return NextResponse.json(publicConfig(loadServerConfig()));
}
