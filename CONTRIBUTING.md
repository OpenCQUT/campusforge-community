# Contributing

## Local development

```bash
pnpm install
cp .env.example .env
pnpm docker:up
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm dev
```

## Branches

- `main`: stable release branch.
- `develop`: integration branch.
- `feature/*`: feature branches.
- `fix/*`: bug fixes.

## Commit messages

We use [Conventional Commits](https://www.conventionalcommits.org/) for all commit messages. This enables automatic changelog generation and semantic versioning.

### Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer(s)]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Formatting, missing semicolons, etc.
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Build process, tooling, dependencies
- `ci`: CI/CD configuration
- `revert`: Reverting previous commits

### Scopes

- `web`: Next.js frontend
- `api`: Fastify backend
- `db`: Prisma schema, migrations, seeds
- `shared`: Shared types, Zod schemas, RBAC
- `config`: TypeScript, ESLint, Prettier
- `docs`: Documentation files
- `ci`: GitHub Actions, workflows
- `deps`: Dependency updates

### Examples

```bash
git commit -m "feat(web): add invitation status tracking"
git commit -m "fix(api): prevent duplicate applications"
git commit -m "docs: update API endpoint documentation"
```

For detailed rules and troubleshooting, see `.codex/skills/campusforge-git-commit/SKILL.md`.

## Pull request checklist

- [ ] Product behavior is documented or linked.
- [ ] UI follows the design tokens in `docs/04-design-system.md`.
- [ ] API changes are documented in `docs/05-api.md`.
- [ ] Database changes include Prisma migration notes.
- [ ] Security/privacy implications are considered.
- [ ] Tests or manual verification notes are included.
