/**
 * Application configuration loaded from environment variables.
 * Client-side values use NEXT_PUBLIC_ prefix.
 */

export const config = {
  admin: {
    email: process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "",
  },
  debug: process.env.NEXT_PUBLIC_DEBUG === "true",
} as const;
