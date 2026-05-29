const courses = [
  {
    title: "Introduction to Open Source",
    description: "Self-paced course covering open-source culture, licensing, and contribution workflows.",
    type: "Self Study",
    difficulty: "Beginner",
    duration: "4 weeks",
    students: 28,
    status: "Active",
  },
  {
    title: "React & Next.js Workshop",
    description: "Hands-on workshop building a full-stack application with React and Next.js App Router.",
    type: "Workshop",
    difficulty: "Intermediate",
    duration: "2 days",
    students: 15,
    status: "Active",
  },
  {
    title: "New Member Onboarding",
    description: "Required onboarding for new community members covering tools, norms, and first contributions.",
    type: "Onboarding",
    difficulty: "Beginner",
    duration: "1 week",
    students: 42,
    status: "Active",
  },
  {
    title: "TypeScript Deep Dive",
    description: "Advanced TypeScript patterns, type-level programming, and practical applications.",
    type: "Cohort",
    difficulty: "Advanced",
    duration: "6 weeks",
    students: 12,
    status: "Active",
  },
];

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

export default function CoursesPage() {
  return (
    <main className="page">
      <div className="page-header">
        <h1 className="page-title">Courses</h1>
        <p className="page-subtitle">
          Learning paths, workshops, and active cohorts to help you grow.
        </p>
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
            <p>{c.description}</p>
            <div className="content-meta">
              <span>{c.duration}</span>
              <span>{c.students} students</span>
              <span className="tag tag-success" style={{ fontSize: "0.7rem" }}>
                {c.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
