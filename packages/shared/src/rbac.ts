export const ROLES = ["STUDENT", "MEMBER", "MAINTAINER", "ADMIN"] as const;

export type Role = (typeof ROLES)[number];

export const PERMISSIONS = [
  "application:self:read",
  "resources:read",
  "resources:write",
  "courses:read",
  "courses:write",
  "policies:read",
  "admin:applications:read",
  "admin:applications:review",
  "audit:read",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

/**
 * Maps each role to the set of permissions it grants.
 * Source of truth: docs/07-security-rbac.md
 */
export const ROLE_PERMISSIONS: Record<Role, ReadonlySet<Permission>> = {
  STUDENT: new Set<Permission>(["application:self:read"]),
  MEMBER: new Set<Permission>([
    "application:self:read",
    "resources:read",
    "courses:read",
    "policies:read",
  ]),
  MAINTAINER: new Set<Permission>([
    "application:self:read",
    "resources:read",
    "resources:write",
    "courses:read",
    "courses:write",
    "policies:read",
  ]),
  ADMIN: new Set<Permission>([
    "application:self:read",
    "resources:read",
    "resources:write",
    "courses:read",
    "courses:write",
    "policies:read",
    "admin:applications:read",
    "admin:applications:review",
    "audit:read",
  ]),
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.has(permission) ?? false;
}
