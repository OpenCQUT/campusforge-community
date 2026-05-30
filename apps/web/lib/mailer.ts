import nodemailer from "nodemailer";
import type { ServerConfig } from "./server-config";

const BRAND = {
  bg950: "#050915",
  bg900: "#07101f",
  bg800: "#0c172a",
  text100: "#f8fbff",
  text300: "#b6c3d9",
  text500: "#71809a",
  cyan: "#12d7e8",
  border: "rgba(125, 150, 255, 0.22)",
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatCode(code: string) {
  return code.replace(/(\d{3})(\d{3})/, "$1 $2");
}

function buildVerificationText(input: { code: string; ttlMinutes: number }) {
  return [
    `Your CampusForge verification code is ${input.code}.`,
    `It expires in ${input.ttlMinutes} minutes.`,
    "If you did not request this code, you can safely ignore this email.",
  ].join("\n");
}

function buildVerificationHtml(input: { code: string; ttlMinutes: number }) {
  const code = escapeHtml(formatCode(input.code));
  const ttlMinutes = escapeHtml(String(input.ttlMinutes));

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="dark">
    <title>CampusForge Email Verification</title>
  </head>
  <body style="margin:0;padding:0;background:${BRAND.bg950};color:${BRAND.text100};font-family:Inter,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;color:transparent;opacity:0;">
      Your CampusForge verification code expires in ${ttlMinutes} minutes.
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${BRAND.bg950};background-image:radial-gradient(circle at 18% 12%, rgba(124,77,255,0.24), transparent 28%),radial-gradient(circle at 86% 18%, rgba(18,215,232,0.16), transparent 28%),linear-gradient(120deg, ${BRAND.bg950}, #03101f);">
      <tr>
        <td align="center" style="padding:40px 18px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;border-collapse:separate;border-spacing:0;">
            <tr>
              <td style="padding:0 0 18px 0;">
                <table role="presentation" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="width:34px;height:34px;border-radius:12px;border:1px solid ${BRAND.border};background:linear-gradient(145deg, rgba(124,77,255,0.26), rgba(18,215,232,0.12));text-align:center;">
                      <span style="display:inline-block;width:13px;height:13px;border:2px solid ${BRAND.cyan};border-radius:5px;transform:rotate(45deg);vertical-align:middle;"></span>
                    </td>
                    <td style="padding-left:12px;">
                      <div style="font-size:18px;line-height:22px;font-weight:800;letter-spacing:0;color:${BRAND.text100};">CampusForge</div>
                      <div style="font-size:10px;line-height:14px;font-weight:700;letter-spacing:2px;color:${BRAND.text500};text-transform:uppercase;">Open Source Community</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="border:1px solid ${BRAND.border};border-radius:18px;background:${BRAND.bg900};background-image:linear-gradient(135deg, rgba(124,77,255,0.16), transparent 36%, rgba(18,215,232,0.09));box-shadow:0 22px 60px rgba(0,0,0,0.36);overflow:hidden;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="padding:34px 32px 28px 32px;">
                      <div style="display:inline-block;padding:7px 11px;border-radius:999px;border:1px solid rgba(18,215,232,0.28);background:rgba(18,215,232,0.08);color:${BRAND.cyan};font-size:12px;line-height:16px;font-weight:700;">Email Verification</div>
                      <h1 style="margin:20px 0 10px 0;color:${BRAND.text100};font-size:26px;line-height:34px;font-weight:800;letter-spacing:0;">Verify your CampusForge email</h1>
                      <p style="margin:0;color:${BRAND.text300};font-size:15px;line-height:24px;">Use this code to continue your invitation request. The code is valid for ${ttlMinutes} minutes.</p>
                      <div style="margin:28px 0;padding:22px 18px;border-radius:14px;border:1px solid rgba(18,215,232,0.22);background:${BRAND.bg800};text-align:center;">
                        <div style="font-size:12px;line-height:16px;color:${BRAND.text500};font-weight:700;text-transform:uppercase;letter-spacing:1.6px;">Verification Code</div>
                        <div style="margin-top:10px;color:${BRAND.text100};font-size:42px;line-height:52px;font-weight:800;letter-spacing:8px;font-family:SFMono-Regular,Consolas,Liberation Mono,Menlo,monospace;">${code}</div>
                      </div>
                      <p style="margin:0;color:${BRAND.text500};font-size:13px;line-height:21px;">If you did not request this code, you can safely ignore this email. For your security, do not share this code with anyone.</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:16px 32px;border-top:1px solid rgba(125,150,255,0.14);background:rgba(5,9,21,0.42);color:${BRAND.text500};font-size:12px;line-height:18px;">
                      This message was sent by CampusForge for account verification.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export async function sendEmailVerificationCode(
  config: ServerConfig,
  input: { email: string; code: string },
) {
  if (config.email.mode === "log") {
    console.info(`[email-verification] ${input.email} code=${input.code}`);
    return;
  }

  if (!config.email.host || !config.email.from) {
    throw new Error("SMTP email is not configured.");
  }

  const transporter = nodemailer.createTransport({
    host: config.email.host,
    port: config.email.encryption === "ssl" ? 465 : 587,
    secure: config.email.encryption === "ssl",
    requireTLS: config.email.encryption === "tls",
    auth: config.email.user
      ? {
          user: config.email.user,
          pass: config.email.pass,
        }
      : undefined,
  });

  await transporter.sendMail({
    from: config.email.from,
    to: input.email,
    subject: "CampusForge email verification code",
    text: buildVerificationText({
      code: input.code,
      ttlMinutes: config.verification.codeTtlMinutes,
    }),
    html: buildVerificationHtml({
      code: input.code,
      ttlMinutes: config.verification.codeTtlMinutes,
    }),
  });
}
