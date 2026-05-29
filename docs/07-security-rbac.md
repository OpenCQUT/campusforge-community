# 07. 安全与权限

## RBAC

| Permission | Student | Member | Maintainer | Admin |
|---|---:|---:|---:|---:|
| `application:self:read` | ✅ | ✅ | ✅ | ✅ |
| `resources:read` | ❌ | ✅ | ✅ | ✅ |
| `resources:write` | ❌ | ❌ | ✅ | ✅ |
| `courses:read` | ❌ | ✅ | ✅ | ✅ |
| `courses:write` | ❌ | ❌ | ✅ | ✅ |
| `policies:read` | ❌ | ✅ | ✅ | ✅ |
| `admin:applications:read` | ❌ | ❌ | ❌ | ✅ |
| `admin:applications:review` | ❌ | ❌ | ❌ | ✅ |
| `audit:read` | ❌ | ❌ | ❌ | ✅ |

## 安全控制

- 邀请申请接口启用限流。
- 学号、邮箱、申请理由仅管理员可见。
- 审核决策需要记录操作者、时间、原因。
- 制度文档可读但不可被普通成员编辑。
- Web 会话使用服务端签名的 `HttpOnly` Cookie；前端可读 Cookie 只能用于界面展示，不能作为权限依据。
- 生产环境必须配置高强度 `CAMPUSFORGE_SESSION_SECRET` 或 `[app].session_secret`，并通过 secret manager 注入。
- 生产环境必须使用 HTTPS 与学校身份系统。

## 数据最小化

申请表只保留必要信息：学校邮箱、学号、院系、兴趣标签和加入理由。不要收集身份证号、电话号码、家庭住址等无关敏感信息。
