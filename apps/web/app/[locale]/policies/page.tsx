import { useLocale, useTranslations } from "next-intl";

const statusColors: Record<string, string> = {
  Active: "tag-success",
  Draft: "tag-muted",
  Reviewed: "tag-blue",
  Archived: "tag-danger",
};

function getPolicies(locale: string) {
  if (locale === "zh") {
    return [
      { title: "行为准则", desc: "社区内的行为和沟通标准。所有成员都应遵守这些准则。", status: "Active", version: 2, updatedAt: "2025-05-01" },
      { title: "邀请规则", desc: "邀请系统的工作方式、资格标准和新成员审核流程。", status: "Active", version: 1, updatedAt: "2025-04-15" },
      { title: "资源共享政策", desc: "在社区仓库中提交、维护和归档资源的规则。", status: "Active", version: 1, updatedAt: "2025-04-10" },
      { title: "安全与隐私", desc: "数据处理实践、漏洞报告程序和隐私承诺。", status: "Active", version: 1, updatedAt: "2025-04-05" },
      { title: "课程参与指南", desc: "对课程参与者的期望、课程组礼仪和认证要求。", status: "Draft", version: 1, updatedAt: "2025-05-20" },
    ];
  }
  return [
    { title: "Code of Conduct", desc: "Standards for behavior and communication within the community. All members are expected to follow these guidelines.", status: "Active", version: 2, updatedAt: "2025-05-01" },
    { title: "Invitation Rules", desc: "How the invitation system works, eligibility criteria, and the review process for new members.", status: "Active", version: 1, updatedAt: "2025-04-15" },
    { title: "Resource Sharing Policy", desc: "Rules for submitting, maintaining, and archiving resources in the community repository.", status: "Active", version: 1, updatedAt: "2025-04-10" },
    { title: "Security & Privacy", desc: "Data handling practices, vulnerability reporting procedures, and privacy commitments.", status: "Active", version: 1, updatedAt: "2025-04-05" },
    { title: "Course Participation Guide", desc: "Expectations for course participants, cohort etiquette, and certification requirements.", status: "Draft", version: 1, updatedAt: "2025-05-20" },
  ];
}

export default function PoliciesPage() {
  const t = useTranslations("policies");
  const locale = useLocale();
  const policies = getPolicies(locale);

  return (
    <main className="page">
      <div className="page-header">
        <h1 className="page-title">{t("title")}</h1>
        <p className="page-subtitle">{t("subtitle")}</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {policies.map((p) => (
          <div key={p.title} className="glass-card policy-card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 16,
              }}
            >
              <div>
                <h3>{p.title}</h3>
                <p>{p.desc}</p>
              </div>
              <span className={`tag ${statusColors[p.status] ?? "tag-muted"}`}>
                {p.status}
              </span>
            </div>
            <div className="policy-footer">
              <span style={{ fontSize: "0.78rem", color: "var(--text-500)" }}>
                {t("version", { version: p.version })} &middot; {p.updatedAt}
              </span>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
