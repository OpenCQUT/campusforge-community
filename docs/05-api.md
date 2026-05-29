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
      "author": "octocat"
    }
  ]
}
```

### `POST /api/github/issues/claim`

认领 GitHub Issue。需要已登录会话；未登录返回 `401`。
服务端读取 `[github].token` 并调用 GitHub assignees API。
Token 需要具备目标仓库 Issue 写权限；未配置 Token 时接口返回 `202`，前端仍会把任务加入本地个人任务列表，但不会同步 GitHub 远端 assign。

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
  "remoteAssigned": true
}
```

## 待实现接口方向

业务 API 尚未实现，后续团队应根据产品需求和数据库模型补充：

- 资源、课程、制度文档读取与维护。
- 成员、权限、管理员审核与审计日志。
- 学校 SSO / OAuth、邮件通知和安全风控集成。

新增接口时同步更新 `docs/openapi.yaml`、共享 schema、后端测试和相关前端调用。
