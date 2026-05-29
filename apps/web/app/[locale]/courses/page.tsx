"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";

type Category = "Programming" | "Design" | "Data" | "Tools" | "Community" | "Exam" | "Competition";

interface CourseResource {
  name: string;
  url: string;
}

interface Course {
  title: string;
  desc: string;
  category: Category;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  source: string;
  isCommunity: boolean;
  resources: CourseResource[];
}

const categoryColors: Record<Category, string> = {
  Programming: "tag-purple",
  Design: "tag-blue",
  Data: "tag-cyan",
  Tools: "tag-muted",
  Community: "tag-success",
  Exam: "tag-danger",
  Competition: "tag-blue",
};

const difficultyColors: Record<string, string> = {
  Beginner: "tag-success",
  Intermediate: "tag-blue",
  Advanced: "tag-danger",
};

function getCourses(l: string): Course[] {
  if (l === "zh") return [
    {
      title: "CS50: 计算机科学导论",
      desc: "哈佛大学经典入门课程，涵盖算法、数据结构、内存管理等核心概念。社区提供中文字幕和学习笔记。",
      category: "Programming", difficulty: "Beginner", source: "Harvard / edX", isCommunity: false,
      resources: [
        { name: "官方课程", url: "https://cs50.harvard.edu" },
        { name: "社区笔记", url: "#" },
        { name: "中文字幕组", url: "#" },
      ],
    },
    {
      title: "freeCodeCamp 响应式 Web 设计",
      desc: "通过实际项目学习 HTML、CSS 和响应式设计。完成所有项目可获得免费认证。",
      category: "Programming", difficulty: "Beginner", source: "freeCodeCamp", isCommunity: false,
      resources: [
        { name: "课程主页", url: "https://freecodecamp.org" },
        { name: "社区攻略", url: "#" },
      ],
    },
    {
      title: "React 官方教程（新版）",
      desc: "React 团队官方出品的交互式教程，从零开始学习 React 核心概念。",
      category: "Programming", difficulty: "Intermediate", source: "React.dev", isCommunity: false,
      resources: [
        { name: "官方教程", url: "https://react.dev" },
        { name: "社区实战补充", url: "#" },
      ],
    },
    {
      title: "社区出品：Git 从入门到实战",
      desc: "由社区成员录制的 Git 系列教程，包含视频讲解、练习题和实战项目。",
      category: "Community", difficulty: "Beginner", source: "CampusForge", isCommunity: true,
      resources: [
        { name: "视频教程", url: "#" },
        { name: "练习仓库", url: "#" },
        { name: "速查表", url: "#" },
      ],
    },
    {
      title: "Figma 设计入门",
      desc: "学习 Figma 基础操作、组件系统和协作功能。适合零基础同学。",
      category: "Design", difficulty: "Beginner", source: "Figma", isCommunity: false,
      resources: [
        { name: "Figma 官方教程", url: "https://figma.com" },
        { name: "社区模板", url: "#" },
      ],
    },
    {
      title: "Python 数据分析（Kaggle）",
      desc: "Kaggle 免费微课程，学习 pandas、数据清洗和可视化。配合社区提供的数据集练习。",
      category: "Data", difficulty: "Intermediate", source: "Kaggle", isCommunity: false,
      resources: [
        { name: "Kaggle 课程", url: "https://kaggle.com/learn" },
        { name: "社区数据集", url: "#" },
      ],
    },
    {
      title: "社区出品：Docker 实战指南",
      desc: "社区维护的 Docker 学习路径，从容器概念到 Docker Compose 编排。",
      category: "Community", difficulty: "Intermediate", source: "CampusForge", isCommunity: true,
      resources: [
        { name: "教程文档", url: "#" },
        { name: "实验环境", url: "#" },
      ],
    },
    {
      title: "The Odin Project 全栈路径",
      desc: "完整的全栈开发学习路径，涵盖 HTML/CSS/JS/React/Node.js/数据库。全部免费。",
      category: "Programming", difficulty: "Intermediate", source: "The Odin Project", isCommunity: false,
      resources: [
        { name: "学习路径", url: "https://theodinproject.com" },
        { name: "社区学习小组", url: "#" },
      ],
    },
    {
      title: "考研数学：张宇高数 18 讲",
      desc: "国内考研数学经典辅导课程，涵盖高等数学核心考点。社区整理了配套笔记和真题解析。",
      category: "Exam", difficulty: "Advanced", source: "张宇", isCommunity: false,
      resources: [
        { name: "课程介绍", url: "#" },
        { name: "社区笔记", url: "#" },
        { name: "真题库", url: "#" },
      ],
    },
    {
      title: "考研英语：唐迟阅读方法论",
      desc: "考研英语阅读理解专项训练，系统讲解解题思路和技巧。",
      category: "Exam", difficulty: "Intermediate", source: "唐迟", isCommunity: false,
      resources: [
        { name: "方法论总结", url: "#" },
        { name: "历年真题", url: "#" },
      ],
    },
    {
      title: "LeetCode 刷题指南",
      desc: "社区整理的 LeetCode 高频题单，按难度和类型分类，附带多种语言题解。",
      category: "Competition", difficulty: "Intermediate", source: "CampusForge", isCommunity: true,
      resources: [
        { name: "题单", url: "#" },
        { name: "题解仓库", url: "#" },
        { name: "每周竞赛讨论", url: "#" },
      ],
    },
    {
      title: "ACM-ICPC 竞赛入门",
      desc: "算法竞赛入门路径，从基础数据结构到高级算法。社区提供训练计划和模拟赛。",
      category: "Competition", difficulty: "Advanced", source: "CampusForge", isCommunity: true,
      resources: [
        { name: "训练计划", url: "#" },
        { name: "模拟赛", url: "#" },
        { name: "题解合集", url: "#" },
      ],
    },
    {
      title: "数学建模竞赛备赛",
      desc: "全国大学生数学建模竞赛备赛资源，包含常用模型、MATLAB/Python 代码模板和历年优秀论文。",
      category: "Competition", difficulty: "Intermediate", source: "CampusForge", isCommunity: true,
      resources: [
        { name: "模型手册", url: "#" },
        { name: "代码模板", url: "#" },
        { name: "优秀论文", url: "#" },
      ],
    },
  ];
  return [
    {
      title: "CS50: Introduction to Computer Science",
      desc: "Harvard's legendary intro course covering algorithms, data structures, and memory. Community provides study notes and discussion groups.",
      category: "Programming", difficulty: "Beginner", source: "Harvard / edX", isCommunity: false,
      resources: [
        { name: "Course Site", url: "https://cs50.harvard.edu" },
        { name: "Community Notes", url: "#" },
        { name: "Study Group", url: "#" },
      ],
    },
    {
      title: "freeCodeCamp Responsive Web Design",
      desc: "Learn HTML, CSS, and responsive design through hands-on projects. Earn a free certification upon completion.",
      category: "Programming", difficulty: "Beginner", source: "freeCodeCamp", isCommunity: false,
      resources: [
        { name: "Course Site", url: "https://freecodecamp.org" },
        { name: "Community Tips", url: "#" },
      ],
    },
    {
      title: "React Official Tutorial (New)",
      desc: "Interactive tutorial from the React team. Learn core React concepts from scratch with hands-on examples.",
      category: "Programming", difficulty: "Intermediate", source: "React.dev", isCommunity: false,
      resources: [
        { name: "Tutorial", url: "https://react.dev" },
        { name: "Community Additions", url: "#" },
      ],
    },
    {
      title: "Community: Git from Zero to Hero",
      desc: "Video tutorial series created by community members. Includes video lessons, exercises, and real-world projects.",
      category: "Community", difficulty: "Beginner", source: "CampusForge", isCommunity: true,
      resources: [
        { name: "Video Series", url: "#" },
        { name: "Practice Repo", url: "#" },
        { name: "Cheat Sheet", url: "#" },
      ],
    },
    {
      title: "Figma Design Fundamentals",
      desc: "Learn Figma basics, component systems, and collaboration features. Perfect for beginners with no design background.",
      category: "Design", difficulty: "Beginner", source: "Figma", isCommunity: false,
      resources: [
        { name: "Figma Tutorials", url: "https://figma.com" },
        { name: "Community Templates", url: "#" },
      ],
    },
    {
      title: "Python Data Analysis (Kaggle)",
      desc: "Kaggle's free micro-courses on pandas, data cleaning, and visualization. Paired with community datasets for practice.",
      category: "Data", difficulty: "Intermediate", source: "Kaggle", isCommunity: false,
      resources: [
        { name: "Kaggle Course", url: "https://kaggle.com/learn" },
        { name: "Community Datasets", url: "#" },
      ],
    },
    {
      title: "Community: Docker Hands-On Guide",
      desc: "Community-maintained Docker learning path from container basics to Docker Compose orchestration.",
      category: "Community", difficulty: "Intermediate", source: "CampusForge", isCommunity: true,
      resources: [
        { name: "Guide", url: "#" },
        { name: "Lab Environment", url: "#" },
      ],
    },
    {
      title: "The Odin Project Full Stack Path",
      desc: "Complete full-stack curriculum covering HTML/CSS/JS/React/Node.js/databases. Entirely free and open source.",
      category: "Programming", difficulty: "Intermediate", source: "The Odin Project", isCommunity: false,
      resources: [
        { name: "Curriculum", url: "https://theodinproject.com" },
        { name: "Community Study Group", url: "#" },
      ],
    },
    {
      title: "考研数学：张宇高数 18 讲",
      desc: "国内考研数学经典辅导课程，涵盖高等数学核心考点。社区整理了配套笔记和真题解析。",
      category: "Exam", difficulty: "Advanced", source: "张宇", isCommunity: false,
      resources: [
        { name: "课程介绍", url: "#" },
        { name: "社区笔记", url: "#" },
        { name: "真题库", url: "#" },
      ],
    },
    {
      title: "考研英语：唐迟阅读方法论",
      desc: "考研英语阅读理解专项训练，系统讲解解题思路和技巧。",
      category: "Exam", difficulty: "Intermediate", source: "唐迟", isCommunity: false,
      resources: [
        { name: "方法论总结", url: "#" },
        { name: "历年真题", url: "#" },
      ],
    },
    {
      title: "LeetCode 刷题指南",
      desc: "社区整理的 LeetCode 高频题单，按难度和类型分类，附带多种语言题解。",
      category: "Competition", difficulty: "Intermediate", source: "CampusForge", isCommunity: true,
      resources: [
        { name: "题单", url: "#" },
        { name: "题解仓库", url: "#" },
        { name: "每周竞赛讨论", url: "#" },
      ],
    },
    {
      title: "ACM-ICPC 竞赛入门",
      desc: "算法竞赛入门路径，从基础数据结构到高级算法。社区提供训练计划和模拟赛。",
      category: "Competition", difficulty: "Advanced", source: "CampusForge", isCommunity: true,
      resources: [
        { name: "训练计划", url: "#" },
        { name: "模拟赛", url: "#" },
        { name: "题解合集", url: "#" },
      ],
    },
    {
      title: "数学建模竞赛备赛",
      desc: "全国大学生数学建模竞赛备赛资源，包含常用模型、MATLAB/Python 代码模板和历年优秀论文。",
      category: "Competition", difficulty: "Intermediate", source: "CampusForge", isCommunity: true,
      resources: [
        { name: "模型手册", url: "#" },
        { name: "代码模板", url: "#" },
        { name: "优秀论文", url: "#" },
      ],
    },
  ];
}

const CATEGORIES: { key: Category | null; labelKey: string }[] = [
  { key: null, labelKey: "filterAll" },
  { key: "Programming", labelKey: "filterProgramming" },
  { key: "Design", labelKey: "filterDesign" },
  { key: "Data", labelKey: "filterData" },
  { key: "Tools", labelKey: "filterTools" },
  { key: "Exam", labelKey: "filterExam" },
  { key: "Competition", labelKey: "filterCompetition" },
  { key: "Community", labelKey: "filterCommunity" },
];

export default function CoursesPage() {
  const t = useTranslations("courses");
  const locale = useLocale();
  const courses = getCourses(locale);
  const [filter, setFilter] = useState<Category | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = filter ? courses.filter((c) => c.category === filter) : courses;

  return (
    <main className="page">
      <div className="page-header">
        <h1 className="page-title">{t("title")}</h1>
        <p className="page-subtitle">{t("subtitle")}</p>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.labelKey}
            className={`btn btn-sm ${filter === cat.key ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setFilter(cat.key)}
          >
            {t(cat.labelKey)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="glass-card" style={{ padding: 40, textAlign: "center" }}>
          <p style={{ color: "var(--text-500)" }}>{t("noCourses")}</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {filtered.map((c) => {
            const isOpen = expanded === c.title;
            return (
              <div key={c.title} className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
                {/* Card header */}
                <div
                  style={{ padding: "20px 24px", cursor: "pointer" }}
                  onClick={() => setExpanded(isOpen ? null : c.title)}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                        <span className={`tag ${categoryColors[c.category]}`}>{c.category}</span>
                        <span className={`tag ${difficultyColors[c.difficulty]}`}>{c.difficulty}</span>
                        {c.isCommunity && <span className="tag tag-success">{t("communityMade")}</span>}
                      </div>
                      <h3 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: 4 }}>{c.title}</h3>
                      <span style={{ fontSize: "0.78rem", color: "var(--text-500)" }}>{c.source}</span>
                    </div>
                    <span style={{ fontSize: "0.82rem", color: "var(--text-500)", whiteSpace: "nowrap" }}>
                      {t("resourcesCount", { count: c.resources.length })}
                    </span>
                  </div>
                  <p style={{ color: "var(--text-300)", fontSize: "0.88rem", lineHeight: 1.6, marginTop: 8 }}>
                    {c.desc}
                  </p>
                </div>

                {/* Expanded resources */}
                {isOpen && (
                  <div style={{ padding: "0 24px 20px", borderTop: "1px solid var(--glass-border)", paddingTop: 16 }}>
                    <h4 style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-500)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      {t("resources")}
                    </h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {c.resources.map((r) => (
                        <a
                          key={r.name}
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                            padding: "10px 14px", borderRadius: "var(--radius-sm)",
                            border: "1px solid var(--glass-border)", color: "var(--text-300)", fontSize: "0.88rem",
                            transition: "border-color 0.15s, background 0.15s",
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(125,150,255,0.3)"; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--glass-border)"; e.currentTarget.style.background = "transparent"; }}
                        >
                          <span>{r.name}</span>
                          <span style={{ fontSize: "0.75rem", color: "var(--text-500)" }}>&#8599;</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
