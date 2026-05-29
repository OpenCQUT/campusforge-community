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
  const [verificationCode, setVerificationCode] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState("");

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!email.trim()) {
      e.email = t("fieldRequired");
    } else if (!validateEmail(email).ok) {
      e.email = t("emailInvalid");
    }
    if (!verificationCode.trim()) e.verificationCode = t("verificationRequired");
    if (!studentId.trim()) e.studentId = t("fieldRequired");
    if (!department.trim()) e.department = t("fieldRequired");
    if (!reason.trim()) e.reason = t("fieldRequired");
    else if (reason.trim().length < 10) e.reason = t("reasonTooShort");
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSendCode() {
    const trimmedEmail = email.trim().toLowerCase();
    setVerificationMessage("");
    setErrors((current) => ({ ...current, email: "", verificationCode: "" }));

    if (!validateEmail(trimmedEmail).ok) {
      setErrors((current) => ({ ...current, email: t("emailInvalid") }));
      return;
    }

    setIsSendingCode(true);
    const response = await fetch("/api/email-verification/request", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: trimmedEmail }),
    });
    setIsSendingCode(false);

    if (!response.ok) {
      setErrors((current) => ({ ...current, verificationCode: t("verificationSendFailed") }));
      return;
    }

    setVerificationMessage(t("verificationSent"));
  }

  async function confirmVerification(): Promise<boolean> {
    const response = await fetch("/api/email-verification/confirm", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        code: verificationCode.trim(),
      }),
    });

    if (!response.ok) {
      setErrors((current) => ({
        ...current,
        verificationCode: t("verificationInvalid"),
      }));
      return false;
    }

    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    const verified = await confirmVerification();
    if (!verified) {
      setIsSubmitting(false);
      return;
    }
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
    setIsSubmitting(false);
    setSubmitted(true);
  }

  function handleReset() {
    setEmail("");
    setStudentId("");
    setDepartment("");
    setReason("");
    setVerificationCode("");
    setVerificationMessage("");
    setErrors({});
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

              <div className="form-row">
                <div className="field">
                  <label htmlFor="verification-code">{t("verificationCode")}</label>
                  <input
                    id="verification-code"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder={t("verificationPlaceholder")}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                  />
                  {verificationMessage && (
                    <span style={{ color: "var(--success)", fontSize: "0.78rem" }}>
                      {verificationMessage}
                    </span>
                  )}
                  {errors.verificationCode && <FieldError msg={errors.verificationCode} />}
                </div>
                <div className="field" style={{ justifyContent: "end" }}>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={handleSendCode}
                    disabled={isSendingCode}
                  >
                    {isSendingCode ? t("sendingCode") : t("sendCode")}
                  </button>
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
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? t("submitting") : tc("submit")}
                </button>
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
