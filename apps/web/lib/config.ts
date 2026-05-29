/**
 * Application configuration loaded from environment variables.
 * Client-side values use NEXT_PUBLIC_ prefix.
 */

export const config = {
  admin: {
    email: process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "",
    password: process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? "",
  },
  debug: process.env.NEXT_PUBLIC_DEBUG === "true",
  allowedEmailDomains: (process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS ?? "")
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean),
} as const;
