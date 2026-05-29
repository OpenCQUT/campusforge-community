import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { loadServerConfig } from "@/lib/server-config";
import { getSessionFromCookieHeader, getSessionSecret } from "@/lib/session";
import AdminClient from "./admin-client";

export default async function AdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const config = loadServerConfig();
  const cookieStore = await cookies();
  const session = await getSessionFromCookieHeader(
    cookieStore.toString(),
    getSessionSecret(config.app.sessionSecret, config.admin.password),
  );

  if (session?.role !== "admin") {
    redirect(`/${locale}/resources`);
  }

  return <AdminClient />;
}
