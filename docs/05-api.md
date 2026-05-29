# 05. API 设计

Base URL：`/v1`

Next.js Web API Base URL：`/api`

## 当前已实现接口

### `GET /health`

Response:

```json
{
  "status": "ok",
  "service": "campusforge-api",
  "version": "0.1.0"
}
```

### `POST /applications`

提交邀请申请。需要 `x-user-id` header。

Request body:

```json
{
  "schoolEmail": "student@school.edu",
  "studentId": "2024001",
  "department": "Computer Science",
  "reason": "I want to join the open-source community."
}
```

Response: `201` 返回创建的申请对象，`409` 表示用户已有申请。

### `GET /applications/me`

获取当前用户的申请。需要 `x-user-id` header。`404` 表示无申请记录。

### `GET /applications/:id`

根据 ID 获取申请详情。

### `GET /applications`

列出所有申请（管理员）。返回 `{ items, total }`。

### `PATCH /applications/:id/review`

审核申请（管理员）。需要 `x-user-id` header。

Request body:

```json
{
  "status": "APPROVED",
  "reviewReason": "Welcome!"
}
```

`status` 可选值：`APPROVED`、`REJECTED`、`NEEDS_INFO`。

## Web 应用接口

### `GET /api/github/issues`

列出 `config.toml` 中 `[github].org` 组织下的开放 Issue。默认组织为 `OpenCQUT`。
需要已登录会话；未登录返回 `401`。

Response:

```json
{
  "org": "OpenCQUT",
  "items": [
    {
      "id": "123",
      "owner": "OpenCQUT",
      "repo": "campusforge-community",
      "number": 12,
      "title": "Fix profile layout",
      "url": "https://github.com/OpenCQUT/campusforge-community/issues/12",
      "state": "open",
      "comments": 2,
      "createdAt": "2026-05-01T00:00:00Z",
      "updatedAt": "2026-05-02T00:00:00Z",
      "labels": [{ "name": "good first issue", "color": "7057ff" }],
      "assignees": [],
      "claimedBy": "octocat",
      "claimedAt": "2026-05-02T10:00:00Z",
      "remoteAssigned": false,
      "author": "octocat"
    }
  ]
}
```

### `POST /api/github/issues/claim`

认领 GitHub Issue。需要已登录会话；未登录返回 `401`。
服务端读取 `[github].token` 并调用 GitHub assignees API。
Token 需要具备目标仓库 Issue 写权限；未配置 Token 或远端 assign 失败时接口返回 `202`，服务端仍会记录认领状态，其他成员在 Issue 列表中也能看到该任务已被认领。

Request body:

```json
{
  "owner": "OpenCQUT",
  "repo": "campusforge-community",
  "number": 12,
  "title": "Fix profile layout",
  "url": "https://github.com/OpenCQUT/campusforge-community/issues/12",
  "assignee": "github-user"
}
```

### `DELETE /api/github/issues/claim`

取消 GitHub Issue 的平台认领记录。需要已登录会话；管理员可取消任意认领，本人可取消自己的认领。

Request body:

```json
{
  "owner": "OpenCQUT",
  "repo": "campusforge-community",
  "number": 12,
  "assignee": "github-user"
}
```

Response:

```json
{
  "cancelled": true
}
```

### `GET /api/github/profile?username=:username`

获取 GitHub 个人贡献统计。服务端缓存同一用户名的统计数据 30 分钟，缓存未过期时不再访问 GitHub API。
需要已登录会话；未登录返回 `401`。

### `GET /api/github/connection`

读取当前登录用户已验证绑定的 GitHub 账号。需要先通过 OAuth 连接，不能手动填写他人的 username。

### `DELETE /api/github/connection`

解绑当前登录用户的 GitHub 账号。

### `GET /api/github/oauth/start`

开始 GitHub OAuth 绑定流程。需要在 `config.toml` 的 `[github]` 中配置 `client_id` 和 `client_secret`。

### `GET /api/github/oauth/callback`

GitHub OAuth 回调地址。验证 `state` 后换取 GitHub 用户身份，并保存已验证的 GitHub 账号关联。

Response:

```json
{
  "remoteAssigned": true,
  "claimedBy": "github-user",
  "claimedAt": "2026-05-02T10:00:00Z"
}
```

## 待实现接口方向

业务 API 尚未实现，后续团队应根据产品需求和数据库模型补充：

- 资源、课程、制度文档读取与维护。
- 成员、权限、管理员审核与审计日志。
- 学校 SSO / OAuth、邮件通知和安全风控集成。

新增接口时同步更新 `docs/openapi.yaml`、共享 schema、后端测试和相关前端调用。
