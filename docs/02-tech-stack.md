# 02. 技术选型

## 前端：Next.js + React + TypeScript

选择 Next.js App Router 的原因：

- 多页面产品结构清晰，适合 Welcome、Resources、Courses、Policies、Admin 等模块。
- 支持静态页面、服务端渲染与后续权限路由扩展。
- 与 TypeScript、React 生态兼容，适合长期维护。

## 样式：CSS 设计令牌优先

本项目暂不强依赖 UI 组件库。原因：

- 参考图的视觉风格高度定制，通用组件库会增加覆写成本。
- CSS 变量可以统一深色背景、发光边框、渐变按钮、卡片层级。
- 后续可以在 `packages/ui` 中沉淀组件库。

## 后端：Fastify + TypeScript

选择 Fastify 的原因：

- 插件化清晰，适合拆分 auth、rate limit、audit、routes。
- REST API 足够支撑当前资源、课程、邀请审核场景。
- 轻量，便于未来拆成独立服务或接入学校身份系统。

## 数据库：PostgreSQL + Prisma ORM

选择 PostgreSQL 的原因：

- 申请、用户、课程、资源、制度、审计日志具有明显关系型结构。
- 支持事务、索引、枚举和复杂查询。

选择 Prisma 的原因：

- schema 可读性高，便于团队理解数据模型。
- 支持迁移、seed、类型化查询。
- 与 TypeScript 后端一致性较好。

## 国际化：next-intl

选择 next-intl 的原因：

- 与 Next.js App Router 深度集成，支持 `[locale]` 动态路由。
- 中间件自动检测语言偏好并重定向。
- JSON 消息文件结构清晰，便于翻译管理。
- 支持英文（en）和中文（zh）。

## Monorepo：pnpm workspace + Turborepo

Monorepo 结构便于共享：

- DTO / Zod schema
- RBAC 常量
- 数据库 schema
- UI tokens 与组件
- CI 流水线
## 不选项

| 选项 | 暂不采用原因 |
|---|---|
| 单体纯 Next.js API Routes | 管理后台和审核流后续可能需要独立服务、队列、审计和学校系统集成。 |
| 大型后端框架 | 当前业务边界清晰，用 Fastify 更轻。 |
| 复杂 UI 库 | 视觉系统需要高度定制，早期使用 CSS tokens 更直接。 |
| MongoDB | 业务实体关系明确，PostgreSQL 更合适。 |
