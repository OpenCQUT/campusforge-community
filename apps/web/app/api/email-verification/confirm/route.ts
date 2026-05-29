import { NextResponse } from "next/server";
import { validateEmail } from "@/lib/email-validation";
import { verifyEmailCode } from "@/lib/email-verification-store";
import { loadServerConfig } from "@/lib/server-config";

export const runtime = "nodejs";

interface RequestBody {
  email?: unknown;
  code?: unknown;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as RequestBody;
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const code = typeof body.code === "string" ? body.code.trim() : "";

  if (!validateEmail(email).ok || !/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: "Invalid verification request." }, { status: 400 });
  }

  const result = await verifyEmailCode(loadServerConfig(), email, code);
  if (!result.ok) {
    return NextResponse.json({ error: "Invalid or expired verification code." }, { status: 400 });
  }

  return NextResponse.json({ verified: true });
}
