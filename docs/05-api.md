# 05. API 设计

Base URL：`/v1`

## 当前已保留接口

### `GET /health`

Response:

```json
{
  "status": "ok",
  "service": "campusforge-api",
  "version": "0.1.0"
}
```

## 待实现接口方向

业务 API 尚未实现，后续团队应根据产品需求和数据库模型补充：

- 邀请申请提交与状态查询。
- 资源、课程、制度文档读取与维护。
- 成员、权限、管理员审核与审计日志。
- 学校 SSO / OAuth、邮件通知和安全风控集成。

新增接口时同步更新 `docs/openapi.yaml`、共享 schema、后端测试和相关前端调用。
