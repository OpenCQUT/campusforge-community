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
- 默认将运行时数据写入 `/opt/campusforge/data`，应用日志写入 `/opt/campusforge/logs`。

首次部署后请登录服务器修改 `/opt/campusforge/config.toml` 中的管理员邮箱、管理员密码和
GitHub OAuth 配置，然后重新执行部署命令或运行：

```bash
cd /opt/campusforge/app
docker compose --env-file /opt/campusforge/.env -f docker-compose.prod.yml up -d --build
```

管理员账号支持列表配置。生产环境可以将 `password` 留空，首次登录相关代码路径加载时会在
`data_dir/admin-password.txt` 生成一个强随机密码：

```toml
[admin]
emails = ["admin@example.edu", "maintainer@example.edu"]
password = ""
```

如果 `password` 写在 `config.toml` 中，密码由配置文件管理，页面内修改密码会被拒绝。
如果 `password` 留空，管理员可在个人中心修改运行时密码，修改结果写入
`data_dir/admin-password.txt`。

邮箱验证码依赖 `config.toml` 的 `[email]` 配置。仓库模板默认保留空 SMTP 字段，生产环境
需要在服务器上填写真实发件服务：

```toml
[email]
mode = "smtp"
from = "CampusForge <noreply@example.edu>"
host = "smtp.example.edu"
port = 587
secure = false
user = "smtp-user"
pass = "smtp-password"
```

如果 `mode = "smtp"` 但 `host` 或 `from` 为空，验证码接口会返回配置错误，不会假装发送成功。
管理员也可以登录网页后在个人中心的服务器配置区域修改 SMTP 和验证码参数。网页保存的配置
写入 `data_dir/runtime-config.json`，SMTP 密码不会在接口响应中回显；密码字段留空表示保留
当前值。

日志配置依赖 `config.toml` 或运行时配置的 `[logging]`，默认等级为 `info`。Web 服务会写入
`log_dir/app.log`，错误会额外写入 `log_dir/error.log`，管理员后台的审计页会展示最近的错误
日志。`app.log` 会按 `max_file_mb` 轮转并 gzip 压缩，压缩归档会按 `retention_days` 定期
清理；`error.log` 不压缩、不自动清理。

SMTP 的 `from` 必须符合邮件服务商策略。多数个人邮箱不能稳定伪造公司域名发件人，否则会被
SPF/DKIM/DMARC 拦截或进入垃圾箱。没有公司邮箱时，建议使用个人邮箱地址或服务商允许的发件
别名作为 `from`。

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
