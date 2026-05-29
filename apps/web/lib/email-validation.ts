import { config } from "./config";

export type EmailValidationResult =
  | { ok: true }
  | { ok: false; error: "format" | "domain" };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate an email address.
 *
 * - In debug mode (NEXT_PUBLIC_DEBUG=true): only checks format.
 * - In production: also enforces the allowed domain list
 *   (NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS). If the list is empty,
 *   domain validation is skipped (any domain accepted).
 */
export function validateEmail(email: string): EmailValidationResult {
  const trimmed = email.trim().toLowerCase();

  if (!EMAIL_RE.test(trimmed)) {
    return { ok: false, error: "format" };
  }

  // Debug mode: format check only
  if (config.debug) {
    return { ok: true };
  }

  // Production: enforce domain whitelist if configured
  if (config.allowedEmailDomains.length > 0) {
    const domain = trimmed.split("@")[1] ?? "";
    if (!config.allowedEmailDomains.includes(domain)) {
      return { ok: false, error: "domain" };
    }
  }

  return { ok: true };
}
