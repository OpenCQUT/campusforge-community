import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { ServerConfig } from "./server-config";

export interface RuntimeConfig {
  admin?: Partial<Pick<ServerConfig["admin"], "email" | "emails">>;
  github?: Partial<ServerConfig["github"]>;
  app?: Partial<Pick<ServerConfig["app"], "debug">>;
  email?: Partial<ServerConfig["email"]>;
  verification?: Partial<ServerConfig["verification"]>;
  logging?: Partial<ServerConfig["logging"]>;
}

function runtimeConfigPath(dataDir: string): string {
  return join(dataDir, "runtime-config.json");
}

function secretString(value: string | undefined, fallback: string): string {
  return value && value !== "<configured>" ? value : fallback;
}

export function readRuntimeConfig(dataDir: string): RuntimeConfig {
  try {
    return JSON.parse(readFileSync(runtimeConfigPath(dataDir), "utf8")) as RuntimeConfig;
  } catch {
    return {};
  }
}

export function writeRuntimeConfig(dataDir: string, config: RuntimeConfig) {
  const path = runtimeConfigPath(dataDir);
  mkdirSync(dirname(path), { recursive: true });
  const tmp = `${path}.${process.pid}.tmp`;
  writeFileSync(tmp, JSON.stringify(config, null, 2), { mode: 0o600 });
  renameSync(tmp, path);
}

export function mergeRuntimeConfig(config: ServerConfig): ServerConfig {
  const runtime = readRuntimeConfig(config.storage.dataDir);
  const email = {
    ...config.email,
    ...runtime.email,
  };
  const emailEncryption =
    email.encryption ?? (email.secure || email.port === 465 ? "ssl" : "tls");

  return {
    ...config,
    admin: {
      ...config.admin,
      ...runtime.admin,
    },
    github: {
      ...config.github,
      ...runtime.github,
      token: secretString(runtime.github?.token, config.github.token),
      clientSecret: secretString(runtime.github?.clientSecret, config.github.clientSecret),
      proxy: secretString(runtime.github?.proxy, config.github.proxy),
    },
    app: {
      ...config.app,
      ...runtime.app,
    },
    email: {
      ...email,
      encryption: emailEncryption,
      port: emailEncryption === "ssl" ? 465 : 587,
      secure: emailEncryption === "ssl",
    },
    verification: {
      ...config.verification,
      ...runtime.verification,
    },
    logging: {
      ...config.logging,
      ...runtime.logging,
    },
  };
}
