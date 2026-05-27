.PHONY: install dev build lint typecheck test db-generate db-migrate db-seed docker-up docker-down

install:
	pnpm install

dev:
	pnpm dev

build:
	pnpm build

lint:
	pnpm lint

typecheck:
	pnpm typecheck

test:
	pnpm test

db-generate:
	pnpm db:generate

db-migrate:
	pnpm db:migrate

db-seed:
	pnpm db:seed

docker-up:
	pnpm docker:up

docker-down:
	pnpm docker:down
