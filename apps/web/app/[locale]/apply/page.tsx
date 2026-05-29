"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { addApplication } from "@/lib/application-store";
import { validateEmail } from "@/lib/email-validation";

export default function ApplyPage() {
  const t = useTranslations("apply");
  const tc = useTranslations("common");

  const [email, setEmail] = useState("");
  const [studentId, setStudentId] = useState("");
  const [department, setDepartment] = useState("");
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!email.trim()) {
      e.email = t("fieldRequired");
    } else if (!validateEmail(email).ok) {
      e.email = t("emailInvalid");
    }
    if (!studentId.trim()) e.studentId = t("fieldRequired");
    if (!department.trim()) e.department = t("fieldRequired");
    if (!reason.trim()) e.reason = t("fieldRequired");
    else if (reason.trim().length < 10) e.reason = t("reasonTooShort");
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    try {
      addApplication({
        email: email.trim(),
        studentId: studentId.trim(),
        department: department.trim(),
        reason: reason.trim(),
      });
    } catch (error) {
      if (error instanceof Error && error.message === "duplicate") {
        setErrors({ email: t("duplicateEmail") });
        return;
      }
      throw error;
    }
    setSubmitted(true);
  }

  function handleReset() {
    setEmail(""); setStudentId(""); setDepartment(""); setReason(""); setErrors({});
  }

  if (submitted) {
    return (
      <main className="page" style={{ maxWidth: 560, margin: "0 auto" }}>
        <div style={{ padding: "80px 0" }}>
          <div className="glass-card" style={{ padding: 40, textAlign: "center" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: 16 }}>&#10003;</div>
            <h1 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: 8 }}>
              {t("successTitle")}
            </h1>
            <p style={{ color: "var(--text-500)", fontSize: "0.9rem", marginBottom: 28 }}>
              {t("successDesc")}
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <Link href="/status" className="btn btn-primary">{t("checkStatus")}</Link>
              <button className="btn btn-ghost" onClick={() => { setSubmitted(false); handleReset(); }}>
                {t("submitAnother")}
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="page apply-page">
      <div className="page-header apply-page-header">
        <h1 className="page-title">{t("title")}</h1>
        <p className="page-subtitle">{t("subtitle")}</p>
      </div>

      <div className="apply-layout">
        <div className="apply-form">
          <div className="glass-card form-card">
            <h2>{t("formTitle")}</h2>
            <form className="form-grid" onSubmit={handleSubmit} noValidate>
              <div className="form-row">
                <div className="field">
                  <label htmlFor="email">{t("email")}</label>
                  <input id="email" type="email" placeholder={t("emailPlaceholder")}
                    value={email} onChange={(e) => setEmail(e.target.value)} />
                  {errors.email && <FieldError msg={errors.email} />}
                </div>
                <div className="field">
                  <label htmlFor="studentId">{t("studentId")}</label>
                  <input id="studentId" type="text" placeholder={t("studentIdPlaceholder")}
                    value={studentId} onChange={(e) => setStudentId(e.target.value)} />
                  {errors.studentId && <FieldError msg={errors.studentId} />}
                </div>
              </div>

              <div className="field">
                <label htmlFor="department">{t("department")}</label>
                <input id="department" type="text" placeholder={t("departmentPlaceholder")}
                  value={department} onChange={(e) => setDepartment(e.target.value)} />
                {errors.department && <FieldError msg={errors.department} />}
              </div>

              <div className="field">
                <label htmlFor="reason">{t("reason")}</label>
                <textarea id="reason" placeholder={t("reasonPlaceholder")} rows={5}
                  value={reason} onChange={(e) => setReason(e.target.value)} />
                {errors.reason && <FieldError msg={errors.reason} />}
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary">{tc("submit")}</button>
                <button type="button" className="btn btn-ghost" onClick={handleReset}>{tc("clear")}</button>
              </div>
            </form>
          </div>
        </div>

        <aside className="apply-sidebar" aria-label={t("whatNext")}>
          <div className="info-card apply-info-card">
            <h3>{t("whatNext")}</h3>
            <p>{t("whatNextDesc")}</p>
            <ul>
              <li>{t("step1")}</li>
              <li>{t("step2")}</li>
              <li>{t("step3")}</li>
            </ul>
          </div>
          <div className="info-card apply-info-card">
            <h3>{t("eligibility")}</h3>
            <p>{t("eligibilityDesc")}</p>
          </div>
        </aside>
      </div>
    </main>
  );
}

function FieldError({ msg }: { msg: string }) {
  return <span style={{ color: "var(--danger)", fontSize: "0.78rem" }}>{msg}</span>;
}
