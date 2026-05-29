export type SessionRole = "admin";

export interface SignedSession {
  email: string;
  role: SessionRole;
  expiresAt: number;
}

const SESSION_TTL_SECONDS = 60 * 60 * 24;

function base64UrlEncode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

async function sign(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(value),
  );
  return Buffer.from(signature).toString("base64url");
}

function parseCookieHeader(cookieHeader: string, name: string): string {
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match?.[1] ? decodeURIComponent(match[1]) : "";
}

function signaturesMatch(received: string, expected: string): boolean {
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);
  if (receivedBuffer.length !== expectedBuffer.length) return false;
  return timingSafeEqual(receivedBuffer, expectedBuffer);
}

export function getSessionSecret(configSecret: string, adminPassword: string): string {
  return configSecret || process.env.CAMPUSFORGE_SESSION_SECRET || adminPassword;
}

export async function createSessionCookieValue(
  email: string,
  role: SessionRole,
  secret: string,
): Promise<string> {
  const session: SignedSession = {
    email,
    role,
    expiresAt: Date.now() + SESSION_TTL_SECONDS * 1000,
  };
  const payload = base64UrlEncode(JSON.stringify(session));
  return `${payload}.${await sign(payload, secret)}`;
}

export async function verifySessionCookieValue(
  value: string,
  secret: string,
): Promise<SignedSession | null> {
  if (!value || !secret) return null;

  const [payload, signature] = value.split(".");
  if (!payload || !signature) return null;

  const expectedSignature = await sign(payload, secret);
  if (!signaturesMatch(signature, expectedSignature)) return null;

  try {
    const session = JSON.parse(base64UrlDecode(payload)) as Partial<SignedSession>;
    if (
      typeof session.email !== "string" ||
      session.role !== "admin" ||
      typeof session.expiresAt !== "number" ||
      session.expiresAt <= Date.now()
    ) {
      return null;
    }
    return {
      email: session.email,
      role: session.role,
      expiresAt: session.expiresAt,
    };
  } catch {
    return null;
  }
}

export async function getSessionFromCookieHeader(
  cookieHeader: string,
  secret: string,
): Promise<SignedSession | null> {
  return verifySessionCookieValue(parseCookieHeader(cookieHeader, "cf_session"), secret);
}

export async function getSessionFromRequest(
  request: Request,
  secret: string,
): Promise<SignedSession | null> {
  return getSessionFromCookieHeader(request.headers.get("cookie") ?? "", secret);
}
import { timingSafeEqual } from "node:crypto";
