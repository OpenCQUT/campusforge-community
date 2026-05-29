import nodemailer from "nodemailer";
import type { ServerConfig } from "./server-config";

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
    port: config.email.port,
    secure: config.email.secure,
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
    text: `Your CampusForge verification code is ${input.code}. It expires soon.`,
  });
}
