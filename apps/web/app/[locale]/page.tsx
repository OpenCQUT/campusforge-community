import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function HomePage() {
  const t = useTranslations("home");
  const tc = useTranslations("common");

  return (
    <main className="page">
      <section className="hero-section">
        <div className="hero-text">
          <p className="hero-eyebrow">{t("eyebrow")}</p>
          <h1 className="hero-title">{t("title")}</h1>
          <p className="hero-lede">{t("lede")}</p>
          <div className="hero-actions">
            <Link href="/apply" className="btn btn-primary">
              {tc("requestInvitation")}
            </Link>
            <Link href="/resources" className="btn btn-ghost">
              {tc("browseResources")}
            </Link>
          </div>
        </div>

        <div className="hero-card">
          <div className="glass-card hero-card-inner">
            <h3>{t("joinTitle")}</h3>
            <p>{t("joinDesc")}</p>
            <Link href="/apply" className="btn btn-primary">
              {tc("getStarted")}
            </Link>
          </div>
        </div>
      </section>

      <section className="preview-section">
        <h2>{t("explore")}</h2>
        <div className="grid-3">
          <Link href="/resources">
            <div className="glass-card preview-card">
              <h3>
                <span className="tag tag-purple">Guide</span>
                {t("resourcesTitle")}
              </h3>
              <p>{t("resourcesDesc")}</p>
              <div className="card-count">{t("resourcesCount")}</div>
            </div>
          </Link>

          <Link href="/courses">
            <div className="glass-card preview-card">
              <h3>
                <span className="tag tag-blue">Learn</span>
                {t("coursesTitle")}
              </h3>
              <p>{t("coursesDesc")}</p>
              <div className="card-count">{t("coursesCount")}</div>
            </div>
          </Link>

          <Link href="/policies">
            <div className="glass-card preview-card">
              <h3>
                <span className="tag tag-cyan">Govern</span>
                {t("policiesTitle")}
              </h3>
              <p>{t("policiesDesc")}</p>
              <div className="card-count">{t("policiesCount")}</div>
            </div>
          </Link>
        </div>
      </section>
    </main>
  );
}
