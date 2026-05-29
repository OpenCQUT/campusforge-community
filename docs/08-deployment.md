# 08. 部署

## 本地环境

```bash
pnpm install
cp .env.example .env
pnpm dev
```

当功能涉及数据库或 Redis 时：

```bash
pnpm docker:up
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

## 生产环境建议

### 单机 Linux 服务器

当前仓库提供一个面向单机 Docker + Nginx 的一键部署脚本，适合域名已经解析到服务器、
服务器可通过 SSH 免密登录的场景。

```bash
scripts/deploy.sh \
  --host <ssh-host> \
  --domain <domain> \
  --cert-zip /path/to/domain_nginx.zip
```

脚本会：

- 打包当前仓库并上传到服务器 `/opt/campusforge/app`。
- 使用 `docker-compose.prod.yml` 构建并启动 Web 与 API 容器。
- 将证书解压到 `/etc/nginx/ssl/<domain>`。
- 按服务器现有 `sites-available` / `sites-enabled` 风格生成 Nginx HTTPS 反代配置。
- 初始化 `/opt/campusforge/.env` 与 `/opt/campusforge/config.toml`，后续部署不会覆盖这两个文件。

首次部署后请登录服务器修改 `/opt/campusforge/config.toml` 中的管理员邮箱、管理员密码和
GitHub OAuth 配置，然后重新执行部署命令或运行：

```bash
cd /opt/campusforge/app
docker compose --env-file /opt/campusforge/.env -f docker-compose.prod.yml up -d --build
```

日常开发时，本地提交并推送到 `main` 后，可以让服务器拉取最新代码并重建容器：

```bash
scripts/update-server.sh --host <ssh-host>
```

也可以安装每天凌晨 03:30 自动更新。该命令会在服务器生成 `/opt/campusforge/update.sh`，
并把日志写入 `/opt/campusforge/update.log`：

```bash
scripts/update-server.sh --host <ssh-host> --install-nightly --skip-immediate
```

如果需要调整时间，传入 cron 表达式即可，例如每天凌晨 02:00：

```bash
scripts/update-server.sh --host <ssh-host> --install-nightly --skip-immediate --schedule "0 2 * * *"
```

### Web

- Node server 或 Vercel-like 平台。
- 设置 `NEXT_PUBLIC_API_BASE_URL`。
- 设置 `CAMPUSFORGE_SESSION_SECRET`，或在 `config.toml` 中设置 `[app].session_secret`。
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
