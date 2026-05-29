# syntax=docker/dockerfile:1

FROM node:22-alpine AS base

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json .npmrc ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/config/package.json packages/config/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN pnpm install --frozen-lockfile

COPY . .

FROM base AS web-build

ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_ADMIN_EMAIL
ARG NEXT_PUBLIC_DEBUG=false

ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_ADMIN_EMAIL=$NEXT_PUBLIC_ADMIN_EMAIL
ENV NEXT_PUBLIC_DEBUG=$NEXT_PUBLIC_DEBUG

RUN pnpm --filter @campusforge/web build

FROM base AS web-runner

ENV NODE_ENV=production
ENV WEB_PORT=3000

COPY --from=web-build /app /app

EXPOSE 3000
CMD ["pnpm", "--filter", "@campusforge/web", "start"]

FROM base AS api-build

RUN pnpm --filter @campusforge/api build

FROM base AS api-runner

ENV NODE_ENV=production
ENV API_PORT=4000

COPY --from=api-build /app /app

EXPOSE 4000
CMD ["pnpm", "--filter", "@campusforge/api", "start"]
