import Link from "next/link";

export default function HomePage() {
  return (
    <main className="page">
      {/* Hero */}
      <section className="hero-section">
        <div className="hero-text">
          <p className="hero-eyebrow">School Open-Source Community</p>
          <h1 className="hero-title">
            Build, share, and learn together.
          </h1>
          <p className="hero-lede">
            CampusForge connects students through open-source projects,
            shared resources, and collaborative courses. Request an
            invitation to join.
          </p>
          <div className="hero-actions">
            <Link href="/apply" className="btn btn-primary">
              Request Invitation
            </Link>
            <Link href="/resources" className="btn btn-ghost">
              Browse Resources
            </Link>
          </div>
        </div>

        <div className="hero-card">
          <div className="glass-card hero-card-inner">
            <h3>Join the Community</h3>
            <p>
              Submit your invitation request and start exploring resources,
              courses, and governance documents.
            </p>
            <Link href="/apply" className="btn btn-primary">
              Get Started
            </Link>
          </div>
        </div>
      </section>

      {/* Preview cards */}
      <section className="preview-section">
        <h2>Explore</h2>
        <div className="grid-3">
          <Link href="/resources">
            <div className="glass-card preview-card">
              <h3>
                <span className="tag tag-purple">Guide</span>
                Resources
              </h3>
              <p>
                Guides, templates, tools, and internal documents shared by
                community members.
              </p>
              <div className="card-count">5 resource types</div>
            </div>
          </Link>

          <Link href="/courses">
            <div className="glass-card preview-card">
              <h3>
                <span className="tag tag-blue">Learn</span>
                Courses
              </h3>
              <p>
                Self-study paths, workshops, onboarding programs, and active
                cohorts.
              </p>
              <div className="card-count">4 course types</div>
            </div>
          </Link>

          <Link href="/policies">
            <div className="glass-card preview-card">
              <h3>
                <span className="tag tag-cyan">Govern</span>
                Policies
              </h3>
              <p>
                Code of conduct, invitation rules, resource sharing policies,
                and security guidelines.
              </p>
              <div className="card-count">5 policy documents</div>
            </div>
          </Link>
        </div>
      </section>
    </main>
  );
}
