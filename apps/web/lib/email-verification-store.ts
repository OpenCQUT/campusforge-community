import { createHash, randomInt } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { ServerConfig } from "./server-config";

interface EmailVerificationRecord {
  email: string;
  codeHash: string;
  expiresAt: number;
  lastSentAt: number;
  attempts: number;
  verifiedUntil: number;
}

type VerificationStore = Record<string, EmailVerificationRecord>;

function storePath(config: ServerConfig): string {
  return join(config.storage.dataDir, "email-verifications.json");
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function hashCode(email: string, code: string, secret: string): string {
  return createHash("sha256")
    .update(`${normalizeEmail(email)}:${code}:${secret}`)
    .digest("hex");
}

async function readStore(config: ServerConfig): Promise<VerificationStore> {
  try {
    return JSON.parse(await readFile(storePath(config), "utf8")) as VerificationStore;
  } catch {
    return {};
  }
}

async function writeStore(config: ServerConfig, store: VerificationStore) {
  const path = storePath(config);
  await mkdir(dirname(path), { recursive: true });
  const tmp = `${path}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(store, null, 2), { mode: 0o600 });
  await rename(tmp, path);
}

export function generateEmailCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export async function createEmailVerification(
  config: ServerConfig,
  email: string,
  code: string,
) {
  const normalizedEmail = normalizeEmail(email);
  const store = await readStore(config);
  const now = Date.now();
  const existing = store[normalizedEmail];

  if (
    existing &&
    now - existing.lastSentAt < config.verification.resendCooldownSeconds * 1000
  ) {
    return { ok: false as const, reason: "cooldown" as const };
  }

  store[normalizedEmail] = {
    email: normalizedEmail,
    codeHash: hashCode(normalizedEmail, code, config.app.sessionSecret),
    expiresAt: now + config.verification.codeTtlMinutes * 60 * 1000,
    lastSentAt: now,
    attempts: 0,
    verifiedUntil: existing?.verifiedUntil ?? 0,
  };
  await writeStore(config, store);
  return { ok: true as const };
}

export async function verifyEmailCode(
  config: ServerConfig,
  email: string,
  code: string,
) {
  const normalizedEmail = normalizeEmail(email);
  const store = await readStore(config);
  const record = store[normalizedEmail];
  const now = Date.now();

  if (!record || record.expiresAt <= now) {
    return { ok: false as const, reason: "expired" as const };
  }

  if (record.attempts >= 5) {
    return { ok: false as const, reason: "locked" as const };
  }

  if (record.codeHash !== hashCode(normalizedEmail, code.trim(), config.app.sessionSecret)) {
    record.attempts += 1;
    await writeStore(config, store);
    return { ok: false as const, reason: "invalid" as const };
  }

  record.verifiedUntil = now + 30 * 60 * 1000;
  record.expiresAt = now;
  await writeStore(config, store);
  return { ok: true as const };
}
