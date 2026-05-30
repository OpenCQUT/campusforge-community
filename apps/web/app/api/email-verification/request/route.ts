import { NextResponse } from "next/server";
import { validateEmail } from "@/lib/email-validation";
import {
  createEmailVerification,
  generateEmailCode,
} from "@/lib/email-verification-store";
import { sendEmailVerificationCode } from "@/lib/mailer";
import { logError, logInfo } from "@/lib/app-logger";
import { loadServerConfig } from "@/lib/server-config";

export const runtime = "nodejs";

interface RequestBody {
  email?: unknown;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as RequestBody;
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!validateEmail(email).ok) {
    return NextResponse.json({ error: "Invalid email." }, { status: 400 });
  }

  const config = loadServerConfig();
  if (!config.app.sessionSecret) {
    return NextResponse.json(
      { error: "Session secret is required for email verification." },
      { status: 503 },
    );
  }

  if (config.email.mode === "smtp" && (!config.email.host || !config.email.from)) {
    logError(config, "email.verification", "SMTP email is not configured");
    return NextResponse.json({ error: "SMTP email is not configured." }, { status: 503 });
  }

  const code = generateEmailCode();
  const created = await createEmailVerification(config, email, code);
  if (!created.ok) {
    return NextResponse.json(
      { error: "Please wait before requesting another code." },
      { status: 429 },
    );
  }

  try {
    await sendEmailVerificationCode(config, { email, code });
    logInfo(config, "email.verification", "verification email sent", {
      email,
      mode: config.email.mode,
    });
  } catch {
    logError(config, "email.verification", "unable to send verification email", {
      email,
      mode: config.email.mode,
    });
    return NextResponse.json({ error: "Unable to send verification email." }, { status: 502 });
  }

  return NextResponse.json({ sent: true });
}
