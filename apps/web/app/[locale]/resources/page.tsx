"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";

const typeColors: Record<string, string> = {
  Guide: "tag-purple",
  Template: "tag-blue",
  Tool: "tag-cyan",
  Policy: "tag-muted",
  "Internal Doc": "tag-success",
};

interface Resource {
  title: string; desc: string; type: string; date: string;
}

function getData(locale: string): Resource[] {
  if (locale === "zh") return [
    { title: "Git 与 GitHub 入门指南", desc: "学习 Git 版本控制基础和 GitHub 协作工作流。", type: "Guide", date: "2025-05-15" },
    { title: "项目提案模板", desc: "在社区内提议新开源项目的结构化模板。", type: "Template", date: "2025-05-10" },
    { title: "VS Code 扩展包", desc: "为 TypeScript、React 和 Python 开发精选的 VS Code 扩展集合。", type: "Tool", date: "2025-05-08" },
    { title: "代码审查指南", desc: "进行建设性代码审查的最佳实践。", type: "Internal Doc", date: "2025-04-28" },
    { title: "资源共享政策", desc: "社区仓库中资源共享的规则和指南。", type: "Policy", date: "2025-04-20" },
    { title: "React 设计模式", desc: "React 组件设计模式与最佳实践汇总。", type: "Guide", date: "2025-05-22" },
  ];
  return [
    { title: "Git & GitHub Starter Guide", desc: "Learn the basics of version control with Git and collaboration workflows on GitHub.", type: "Guide", date: "2025-05-15" },
    { title: "Project Proposal Template", desc: "A structured template for proposing new open-source projects within the community.", type: "Template", date: "2025-05-10" },
    { title: "VS Code Extension Pack", desc: "Curated set of VS Code extensions for TypeScript, React, and Python development.", type: "Tool", date: "2025-05-08" },
    { title: "Code Review Guidelines", desc: "Best practices for giving and receiving constructive code reviews.", type: "Internal Doc", date: "2025-04-28" },
    { title: "Resource Sharing Policy", desc: "Rules and guidelines for sharing resources in the community repository.", type: "Policy", date: "2025-04-20" },
    { title: "React Design Patterns", desc: "Common React component design patterns and best practices.", type: "Guide", date: "2025-05-22" },
  ];
}

const TYPES = ["Guide", "Template", "Tool", "Policy", "Internal Doc"];

export default function ResourcesPage() {
  const t = useTranslations("resources");
  const tc = useTranslations("common");
  const locale = useLocale();
  const items = getData(locale);
  const [filter, setFilter] = useState<string | null>(null);

  const filtered = filter ? items.filter((r) => r.type === filter) : items;

  return (
    <main className="page">
      <div className="page-header">
        <h1 className="page-title">{t("title")}</h1>
        <p className="page-subtitle">{t("subtitle")}</p>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        <button
          className={`btn btn-sm ${filter === null ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setFilter(null)}
        >
          {tc("all")}
        </button>
        {TYPES.map((type) => (
          <button
            key={type}
            className={`btn btn-sm ${filter === type ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setFilter(type)}
          >
            {type}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="glass-card" style={{ padding: 40, textAlign: "center" }}>
          <p style={{ color: "var(--text-500)" }}>{tc("all")}</p>
        </div>
      ) : (
        <div className="grid-3">
          {filtered.map((r) => (
            <div key={r.title} className="glass-card content-card">
              <div className="content-meta">
                <span className={`tag ${typeColors[r.type] ?? "tag-muted"}`}>{r.type}</span>
              </div>
              <h3>{r.title}</h3>
              <p>{r.desc}</p>
              <div className="content-meta">
                <span>{tc("updated", { date: r.date })}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
