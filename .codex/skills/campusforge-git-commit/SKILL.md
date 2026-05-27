---
name: campusforge-git-commit
description: Generate and review Git commits for CampusForge. Use when preparing, splitting, naming, or validating commits in this repository.
---

# CampusForge Git Commit Skill

Use this skill to create small, auditable commits for the CampusForge monorepo. The goal is to keep history useful for review, release notes, rollback, and incident analysis.

## Commit Contract

Every commit MUST satisfy all of the following:

- Contains one logical change only.
- Builds on top of existing project conventions instead of introducing parallel patterns.
- Includes directly affected tests, docs, schemas, migrations, or generated artifacts when applicable.
- Uses Conventional Commits format accepted by `commitlint.config.js`.
- Avoids secrets, local machine paths, debug leftovers, generated caches, and unrelated formatting churn.

## Message Format

```text
<type>(<scope>): <subject>

[body]

[footer]
```

The scope is optional only when no project area is clearly dominant.

## Types

Use exactly one type:

| Type | Use for |
| --- | --- |
| `feat` | User-visible product capability or API behavior. |
| `fix` | Bug fix, broken behavior, regression, data correctness issue. |
| `docs` | Documentation-only change. |
| `style` | Formatting-only change with no runtime or type behavior change. |
| `refactor` | Internal code change that does not add behavior or fix a bug. |
| `perf` | Measurable performance improvement. |
| `test` | Test-only change or test infrastructure. |
| `chore` | Tooling, dependency, repository maintenance. |
| `ci` | GitHub Actions, release automation, CI configuration. |
| `revert` | Revert of a previous commit. |

If a change both fixes a bug and refactors code, use `fix` when the user-visible behavior changes. If it only improves structure, use `refactor`.

## Scopes

Prefer these repository scopes because they match `commitlint.config.js`:

| Scope | Use for |
| --- | --- |
| `web` | Next.js frontend app, routing, pages, client/server components. |
| `ui` | Reusable UI components, CSS tokens, layout primitives, visual system. |
| `api` | Fastify backend, REST endpoints, request lifecycle. |
| `db` | Prisma schema, migrations, seed data, database client. |
| `shared` | Shared DTOs, Zod schemas, cross-package constants. |
| `auth` | Authentication, identity integration, session handling. |
| `rbac` | Roles, permissions, access-control decisions. |
| `core` | Cross-cutting business logic not owned by one app/package. |
| `config` | TypeScript, ESLint, Prettier, Turbo, package configuration. |
| `deps` | Dependency updates and lockfile-only dependency maintenance. |
| `ci` | Workflows and CI-only scripts. |
| `docs` | Documentation files. |

For mature frontend work, split large UI changes by stable review boundary:

- `feat(web)` for new route-level capability.
- `feat(ui)` for new reusable component behavior.
- `fix(ui)` for visual or interaction defects in shared components.
- `style(ui)` only when output behavior is unchanged.
- `perf(web)` only when the commit directly improves rendering, loading, or bundle behavior.

## Subject Rules

The subject MUST:

- Be imperative and present tense: `add`, `prevent`, `normalize`; not `added`, `adds`, `updated`.
- Start lowercase.
- Have no trailing period.
- Be 72 characters or fewer.
- Describe the behavior or repository effect, not the implementation detail.

Good subjects:

```text
feat(web): add invitation review dashboard
fix(ui): preserve focus when closing command menu
refactor(shared): centralize invitation status schema
perf(web): defer loading member graph visualization
```

Bad subjects:

```text
fix: fixed stuff
chore: update
feat(web): Add New Page.
refactor: changed files
```

## Body Rules

Add a body when the subject alone cannot explain risk or intent. The body SHOULD explain what changed and why; avoid narrating obvious code mechanics.

Use a body for:

- Non-trivial frontend state, routing, caching, accessibility, or rendering changes.
- API, schema, permission, or data model behavior changes.
- Tradeoffs, migration notes, rollback notes, or compatibility constraints.

Wrap body lines at 100 characters to match repository commitlint warnings.

Example:

```text
fix(web): keep invitation filters in sync with URL state

Store the selected status in search params so shared links preserve the same
review queue and browser navigation does not reset the filter.
```

## Footer Rules

Use footers for issue links, breaking changes, and revert metadata.

```text
Closes #42
Fixes #89
Refs #104
BREAKING CHANGE: invitation status values now use shared enum names.
```

Breaking changes MUST use `BREAKING CHANGE:` in the footer and describe the migration impact.

## Commit Splitting Standard

Before committing, split changes until each commit can be reviewed and reverted independently.

Keep together:

- Component change plus its directly affected styles and tests.
- API contract change plus shared schema update and tests proving the contract.
- Prisma schema change plus required migration and generated client updates.
- Dependency version update plus lockfile change.

Split apart:

- Feature work and opportunistic refactors.
- Formatting-only churn and behavior changes.
- Frontend UI changes and unrelated backend changes.
- Dependency upgrades and product code changes, unless the product code is required by the upgrade.
- Generated artifacts that belong to different logical changes.

## Frontend-Specific Quality Gate

For frontend commits, verify the affected behavior before committing:

- UI follows `docs/04-design-system.md` tokens, spacing, states, and visual tone.
- Interactive controls preserve keyboard access, focus behavior, labels, and disabled/loading states.
- Client/server boundaries are intentional; avoid unnecessary client components.
- Data-fetching, loading, empty, error, and permission states are covered when affected.
- Tests or manual verification notes cover the changed user behavior.

## Repository Commands

Local hooks run through Husky:

- `pre-commit`: `pnpm lint` and `pnpm typecheck`
- `commit-msg`: `npx --no -- commitlint --edit <message-file>`

Useful manual checks:

```bash
pnpm lint
pnpm typecheck
printf '%s\n' 'feat(web): add invitation status tracking' | pnpm exec commitlint
```

Do not bypass hooks with `--no-verify` unless an emergency process explicitly allows it.

## Workflow

1. Inspect the diff and remove unrelated edits before staging.
2. Stage by logical unit with `git add -p` when needed.
3. Choose type by externally observable intent.
4. Choose scope by primary owner of the changed files.
5. Write the shortest subject that still identifies the behavior.
6. Add a body or footer when risk, issue linkage, migration, or rollback context matters.
7. Run the relevant verification before committing.

## Review Checklist

Before accepting a commit message, confirm:

- Type and scope match the actual diff.
- Subject is lowercase, imperative, concise, and has no period.
- Body explains why for non-trivial behavior or architecture changes.
- Breaking changes and issue links are in footers.
- The commit contains no unrelated formatting, debug output, secrets, local files, or generated noise.
- Verification matches the changed behavior rather than only proving the project can start.
