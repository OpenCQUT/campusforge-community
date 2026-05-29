# 05. API 设计

Base URL：`/v1`

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

## 待实现接口方向

业务 API 尚未实现，后续团队应根据产品需求和数据库模型补充：

- 资源、课程、制度文档读取与维护。
- 成员、权限、管理员审核与审计日志。
- 学校 SSO / OAuth、邮件通知和安全风控集成。

新增接口时同步更新 `docs/openapi.yaml`、共享 schema、后端测试和相关前端调用。
