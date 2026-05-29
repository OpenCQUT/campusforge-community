import { useLocale, useTranslations } from "next-intl";

const typeColors: Record<string, string> = {
  Guide: "tag-purple",
  Template: "tag-blue",
  Tool: "tag-cyan",
  Policy: "tag-muted",
  "Internal Doc": "tag-success",
};

function getDescriptions(locale: string) {
  const en = [
    { title: "Git & GitHub Starter Guide", desc: "Learn the basics of version control with Git and collaboration workflows on GitHub.", type: "Guide", date: "2025-05-15" },
    { title: "Project Proposal Template", desc: "A structured template for proposing new open-source projects within the community.", type: "Template", date: "2025-05-10" },
    { title: "VS Code Extension Pack", desc: "Curated set of VS Code extensions for TypeScript, React, and Python development.", type: "Tool", date: "2025-05-08" },
    { title: "Code Review Guidelines", desc: "Best practices for giving and receiving constructive code reviews.", type: "Internal Doc", date: "2025-04-28" },
    { title: "Resource Sharing Policy", desc: "Rules and guidelines for sharing resources in the community repository.", type: "Policy", date: "2025-04-20" },
  ];
  const zh = [
    { title: "Git 与 GitHub 入门指南", desc: "学习 Git 版本控制基础和 GitHub 协作工作流。", type: "Guide", date: "2025-05-15" },
    { title: "项目提案模板", desc: "在社区内提议新开源项目的结构化模板。", type: "Template", date: "2025-05-10" },
    { title: "VS Code 扩展包", desc: "为 TypeScript、React 和 Python 开发精选的 VS Code 扩展集合。", type: "Tool", date: "2025-05-08" },
    { title: "代码审查指南", desc: "进行建设性代码审查的最佳实践。", type: "Internal Doc", date: "2025-04-28" },
    { title: "资源共享政策", desc: "社区仓库中资源共享的规则和指南。", type: "Policy", date: "2025-04-20" },
  ];
  return locale === "zh" ? zh : en;
}

export default function ResourcesPage() {
  const t = useTranslations("resources");
  const tc = useTranslations("common");
  const locale = useLocale();
  const items = getDescriptions(locale);

  return (
    <main className="page">
      <div className="page-header">
        <h1 className="page-title">{t("title")}</h1>
        <p className="page-subtitle">{t("subtitle")}</p>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        <button className="btn btn-sm btn-primary">{tc("all")}</button>
        <button className="btn btn-sm btn-ghost">Guide</button>
        <button className="btn btn-sm btn-ghost">Template</button>
        <button className="btn btn-sm btn-ghost">Tool</button>
        <button className="btn btn-sm btn-ghost">Policy</button>
        <button className="btn btn-sm btn-ghost">Internal Doc</button>
      </div>

      <div className="grid-3">
        {items.map((r) => (
          <div key={r.title} className="glass-card content-card">
            <div className="content-meta">
              <span className={`tag ${typeColors[r.type] ?? "tag-muted"}`}>
                {r.type}
              </span>
            </div>
            <h3>{r.title}</h3>
            <p>{r.desc}</p>
            <div className="content-meta">
              <span>{tc("updated", { date: r.date })}</span>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
