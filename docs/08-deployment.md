# 08. 部署

## 本地环境

```bash
pnpm install
cp .env.example .env
pnpm docker:up
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm dev
```

## 生产环境建议

### Web

- Node server 或 Vercel-like 平台。
- 设置 `NEXT_PUBLIC_API_BASE_URL`。
- 配置 CSP、HTTPS、错误监控。

### API

- Docker 镜像部署。
- 环境变量由 secret manager 注入。
- 连接生产 PostgreSQL 和 Redis。
- 配置 CORS 白名单。

### 数据库

- 启用自动备份。
- 分离只读账号和迁移账号。
- 定期测试恢复流程。

## 发布流程

1. Merge 到 `main`。
2. CI 执行 lint/typecheck/test/build。
3. 生成前端和后端镜像。
4. 数据库迁移。
5. 灰度发布。
6. 观察日志、错误率和审核流程。
