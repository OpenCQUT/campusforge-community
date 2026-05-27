# ADR 0001: Tech stack

## Decision

Use a TypeScript monorepo with:

- Next.js App Router for the web application.
- Fastify for the API service.
- PostgreSQL + Prisma ORM for data persistence.
- pnpm workspaces + Turborepo for repository orchestration.

## Context

CampusForge is a school internal website with multiple product areas: invitations, resources, courses, policies, members, and administration. The product needs a polished web UI and an auditable backend workflow.

## Consequences

- Teams can share schemas and RBAC constants across frontend and backend.
- API can later integrate school SSO and email services without forcing all logic into the frontend framework.
- Database schema remains explicit and reviewable.
