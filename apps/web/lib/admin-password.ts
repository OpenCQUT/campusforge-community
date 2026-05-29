import { randomBytes, timingSafeEqual } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { ServerConfig } from "./server-config";

const PASSWORD_FILE = "admin-password.txt";

function passwordPath(config: ServerConfig): string {
  return join(config.storage.dataDir, PASSWORD_FILE);
}

function generatePassword(): string {
  return randomBytes(18).toString("base64url");
}

export function getAdminPassword(config: ServerConfig): string {
  if (config.admin.password) return config.admin.password;

  const path = passwordPath(config);
  if (existsSync(path)) {
    return readFileSync(path, "utf8").trim();
  }

  const password = generatePassword();
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${password}\n`, { mode: 0o600 });
  console.info(`[admin] generated initial admin password at ${path}`);
  return password;
}

export function setAdminPassword(config: ServerConfig, password: string) {
  const path = passwordPath(config);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${password}\n`, { mode: 0o600 });
}

export function isAdminEmail(config: ServerConfig, email: string): boolean {
  const normalized = email.trim().toLowerCase();
  return config.admin.emails.some((adminEmail) => adminEmail.toLowerCase() === normalized);
}

export function passwordsMatch(received: string, expected: string): boolean {
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);
  if (receivedBuffer.length !== expectedBuffer.length) return false;
  return timingSafeEqual(receivedBuffer, expectedBuffer);
}
