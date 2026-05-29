# 06. 数据库模型

核心实体：

- `User`
- `Membership`
- `InvitationApplication`
- `Invitation`
- `Interest`
- `Resource`
- `Course`
- `CourseEnrollment`
- `PolicyDocument`
- `AuditLog`
- `IssueClaim`
- `GitHubProfileCache`
- `GitHubConnection`

## 邀请状态

```text
DRAFT -> SUBMITTED -> VERIFYING -> UNDER_REVIEW -> APPROVED / REJECTED / NEEDS_INFO
```

## 审计日志

每个管理员操作应写入 `AuditLog`：

- actorId
- action
- targetType
- targetId
- metadata
- createdAt

## 索引建议

- `InvitationApplication.status`
- `InvitationApplication.schoolEmail`
- `Resource.type`
- `Resource.updatedAt`
- `Course.status`
- `PolicyDocument.status`
- `AuditLog.createdAt`
- `IssueClaim(owner, repo, number)`
- `GitHubProfileCache.username`
- `GitHubProfileCache.fetchedAt`
- `GitHubConnection.email`
- `GitHubConnection.githubId`
