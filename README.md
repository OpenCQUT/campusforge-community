# CampusForge

CampusForge 是一个面向学校内部的邀请制开源社区网站项目模板。它覆盖资源分享、课程分享、成员协作、内部管理制度、邀请审核与管理员工作台，并以深色科技风视觉系统为核心。

本仓库按成熟开源项目结构组织：前端、后端、数据库、共享类型、基础设施、CI、文档、治理文件均已分层。

## 项目定位

- **目标用户**：校内学生、课程/项目维护者、社区管理员。
- **核心场景**：邀请申请、审核流转、资源中心、课程中心、制度文档、成员协作。
- **视觉方向**：深色科技风、星图/网络纹理、紫蓝青渐变、克制发光边框、简洁信息密度。
- **访问方式**：邀请制，管理员审核后开通访问。

## 技术选型

| 层级     | 选型                                    | 原因                                                              |
| -------- | --------------------------------------- | ----------------------------------------------------------------- |
| 前端     | Next.js App Router + React + TypeScript | 适合多页面产品、权限路由、SSR/静态混合、后续 SEO 与校内门户集成。 |
| 样式     | CSS 设计令牌 + 组件化 CSS               | 避免早期过度依赖 UI 库，便于严格还原图片里的科技风视觉。          |
| 后端     | Fastify + TypeScript                    | 轻量、插件化、适合 REST API、健康检查、权限中间件与审计。         |
| 数据库   | PostgreSQL + Prisma ORM                 | 邀请、成员、资源、课程、制度文档属于关系型业务，便于建模与迁移。  |
| Monorepo | pnpm workspace + Turborepo              | 统一管理 web/api/db/shared 包，提升 CI 与本地开发效率。           |
| 基础设施 | Docker Compose                          | 本地快速启动 PostgreSQL 与 Redis。                                |

## 目录结构

```text
campusforge/
├── apps/
│   ├── web/                 # Next.js 前端应用
│   └── api/                 # Fastify 后端服务
├── packages/
│   ├── db/                  # Prisma schema / seed / DB client
│   ├── shared/              # DTO、Zod schema、RBAC 常量
│   └── config/              # TypeScript 基础配置
├── docs/                    # 产品、架构、API、设计系统、安全与部署文档
├── .github/                 # CI、Issue 模板、PR 模板
├── docker-compose.yml       # PostgreSQL / Redis
├── turbo.json               # Monorepo task pipeline
└── README.md
```

## 快速启动

```bash
pnpm install
cp .env.example .env
cp config.example.toml config.toml
pnpm dev
```

GitHub Issue 认领功能会读取 `[github]` 配置。`token` 留空时仍可在站内认领任务，
但不会自动同步 GitHub assignee；要同步远端分配，需要配置具备组织仓库 Issue 写权限的 token。

默认端口：

- Web: `http://localhost:3000`
- API: `http://localhost:4000/v1`

## Git 提交规范

本项目使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范所有提交消息。详细的规则和使用说明请参考仓库
skill：`.codex/skills/campusforge-git-commit/SKILL.md`。

### 快速示例

```bash
git commit -m "feat(web): add invitation status tracking"
git commit -m "fix(api): prevent duplicate applications"
git commit -m "docs: update API endpoint documentation"
```

### 支持的类型

- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建/工具/依赖
- `ci`: CI/CD 配置
- `revert`: 回滚提交

## 框架保留范围

当前仓库保留可继续开发的项目框架：

- `apps/web`：Next.js App Router 骨架、根布局、全局样式和占位首页。
- `apps/api`：Fastify 服务骨架、安全中间件、环境配置、健康检查和基础测试。
- `packages/db`：Prisma/PostgreSQL 包骨架、client wiring、空 schema 和空 seed。
- `packages/shared`：跨应用共享包入口。
- `docs`：产品、架构、设计、API、数据库、安全、部署与运营文档。

## 开源项目文件

本仓库包含：

- `LICENSE`
- `CONTRIBUTING.md`
- `CODE_OF_CONDUCT.md`
- `SECURITY.md`
- `GOVERNANCE.md`
- `.github/workflows/ci.yml`
- `.github/ISSUE_TEMPLATE/*`
- `.github/pull_request_template.md`

## 说明

当前项目以“可继续开发的成熟模板”为目标。产品页面、业务接口、RBAC 规则、数据库模型、种子数据和真实
SSO / OAuth、邮件服务、审计日志等集成均保留给后续实现团队完成。
