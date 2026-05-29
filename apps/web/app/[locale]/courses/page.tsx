import { useLocale, useTranslations } from "next-intl";

const typeColors: Record<string, string> = {
  "Self Study": "tag-purple",
  Workshop: "tag-blue",
  Onboarding: "tag-cyan",
  Cohort: "tag-success",
};

const difficultyColors: Record<string, string> = {
  Beginner: "tag-success",
  Intermediate: "tag-blue",
  Advanced: "tag-danger",
};

function getCourses(locale: string) {
  if (locale === "zh") {
    return [
      { title: "开源入门", desc: "自学课程，涵盖开源文化、许可和贡献工作流。", type: "Self Study", difficulty: "Beginner", duration: "4 周", students: 28 },
      { title: "React 与 Next.js 工作坊", desc: "使用 React 和 Next.js App Router 构建全栈应用的实践工作坊。", type: "Workshop", difficulty: "Intermediate", duration: "2 天", students: 15 },
      { title: "新成员入职培训", desc: "新社区成员必修的入职培训，涵盖工具、规范和首次贡献。", type: "Onboarding", difficulty: "Beginner", duration: "1 周", students: 42 },
      { title: "TypeScript 深入学习", desc: "高级 TypeScript 模式、类型级编程和实际应用。", type: "Cohort", difficulty: "Advanced", duration: "6 周", students: 12 },
    ];
  }
  return [
    { title: "Introduction to Open Source", desc: "Self-paced course covering open-source culture, licensing, and contribution workflows.", type: "Self Study", difficulty: "Beginner", duration: "4 weeks", students: 28 },
    { title: "React & Next.js Workshop", desc: "Hands-on workshop building a full-stack application with React and Next.js App Router.", type: "Workshop", difficulty: "Intermediate", duration: "2 days", students: 15 },
    { title: "New Member Onboarding", desc: "Required onboarding for new community members covering tools, norms, and first contributions.", type: "Onboarding", difficulty: "Beginner", duration: "1 week", students: 42 },
    { title: "TypeScript Deep Dive", desc: "Advanced TypeScript patterns, type-level programming, and practical applications.", type: "Cohort", difficulty: "Advanced", duration: "6 weeks", students: 12 },
  ];
}

export default function CoursesPage() {
  const t = useTranslations("courses");
  const locale = useLocale();
  const courses = getCourses(locale);

  return (
    <main className="page">
      <div className="page-header">
        <h1 className="page-title">{t("title")}</h1>
        <p className="page-subtitle">{t("subtitle")}</p>
      </div>

      <div className="grid-2">
        {courses.map((c) => (
          <div key={c.title} className="glass-card content-card">
            <div className="content-meta">
              <span className={`tag ${typeColors[c.type] ?? "tag-muted"}`}>
                {c.type}
              </span>
              <span className={`tag ${difficultyColors[c.difficulty] ?? "tag-muted"}`}>
                {c.difficulty}
              </span>
            </div>
            <h3>{c.title}</h3>
            <p>{c.desc}</p>
            <div className="content-meta">
              <span>{c.duration}</span>
              <span>{c.students} students</span>
              <span className="tag tag-success" style={{ fontSize: "0.7rem" }}>
                Active
              </span>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
