export type EmailValidationResult =
  | { ok: true }
  | { ok: false; error: "format" };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate email format. Any domain is accepted (school or personal).
 */
export function validateEmail(email: string): EmailValidationResult {
  if (!EMAIL_RE.test(email.trim().toLowerCase())) {
    return { ok: false, error: "format" };
  }
  return { ok: true };
}
