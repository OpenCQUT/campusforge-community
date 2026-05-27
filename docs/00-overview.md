# 00. 项目总览

CampusForge 是一个学校内部邀请制社区网站，面向“资源分享、课程分享、成员连接、制度治理、邀请审核”五类核心场景。

## 产品原则

1. **邀请优先**：用户进入社区前需要完成邀请或审核。
2. **简洁清晰**：避免堆叠过多统计、说明和卡片，核心信息优先。
3. **可信治理**：制度、申请、管理员操作要可追踪。
4. **科技但克制**：保留深色星图、紫蓝青渐变、细边框发光，但减少装饰密度。
5. **开源项目式组织**：文档、贡献规范、安全策略和治理文件完整。

## 页面地图

```text
Welcome
├── Request Invitation
├── Application Status
├── Resources
├── Courses
├── Members
├── Policies / Governance
└── Admin
    ├── Application Review
    ├── Members
    ├── Invitations
    ├── Courses
    ├── Resources
    └── Audit Log
```

## MVP 范围

- 视觉系统与主要页面。
- 邀请申请、审核、状态跟踪的 API 骨架。
- 资源、课程、制度文档的数据模型。
- 管理员审核台。
- RBAC、审计日志与治理文档。
