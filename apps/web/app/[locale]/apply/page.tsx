import { useTranslations } from "next-intl";

export default function ApplyPage() {
  const t = useTranslations("apply");
  const tc = useTranslations("common");

  return (
    <main className="page">
      <div className="page-header">
        <h1 className="page-title">{t("title")}</h1>
        <p className="page-subtitle">{t("subtitle")}</p>
      </div>

      <div className="apply-layout">
        <div className="apply-form">
          <div className="glass-card form-card">
            <h2>{t("formTitle")}</h2>
            <form className="form-grid">
              <div className="form-row">
                <div className="field">
                  <label htmlFor="email">{t("email")}</label>
                  <input
                    id="email"
                    type="email"
                    placeholder={t("emailPlaceholder")}
                  />
                </div>
                <div className="field">
                  <label htmlFor="studentId">{t("studentId")}</label>
                  <input
                    id="studentId"
                    type="text"
                    placeholder={t("studentIdPlaceholder")}
                  />
                </div>
              </div>

              <div className="field">
                <label htmlFor="department">{t("department")}</label>
                <input
                  id="department"
                  type="text"
                  placeholder={t("departmentPlaceholder")}
                />
              </div>

              <div className="field">
                <label htmlFor="reason">{t("reason")}</label>
                <textarea
                  id="reason"
                  placeholder={t("reasonPlaceholder")}
                  rows={5}
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  {tc("submit")}
                </button>
                <button type="reset" className="btn btn-ghost">
                  {tc("clear")}
                </button>
              </div>
            </form>
          </div>
        </div>

        <aside className="apply-sidebar">
          <div className="glass-card info-card">
            <h3>{t("whatNext")}</h3>
            <p>{t("whatNextDesc")}</p>
            <ul>
              <li>{t("step1")}</li>
              <li>{t("step2")}</li>
              <li>{t("step3")}</li>
            </ul>
          </div>

          <div className="glass-card info-card" style={{ marginTop: 16 }}>
            <h3>{t("eligibility")}</h3>
            <p>{t("eligibilityDesc")}</p>
          </div>
        </aside>
      </div>
    </main>
  );
}
