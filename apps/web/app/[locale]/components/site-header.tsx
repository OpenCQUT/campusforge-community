"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";

function getSessionRole(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/cf_session=(\w+)/);
  return match?.[1] ?? null;
}

export function SiteHeader() {
  const pathname = usePathname();
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const role = getSessionRole();
  const isLoggedIn = role !== null;
  const isAdmin = role === "admin";

  const publicNav = [
    { href: "/apply", label: t("nav.apply") },
    { href: "/status", label: t("nav.status") },
  ];

  const memberNav = [
    { href: "/resources", label: t("nav.resources") },
    { href: "/courses", label: t("nav.courses") },
    { href: "/policies", label: t("nav.policies") },
  ];

  const adminNav = [
    { href: "/admin", label: t("nav.admin") },
    { href: "/resources", label: t("nav.resources") },
    { href: "/courses", label: t("nav.courses") },
    { href: "/policies", label: t("nav.policies") },
  ];

  const navItems = !isLoggedIn
    ? publicNav
    : isAdmin
      ? adminNav
      : memberNav;

  function switchLocale() {
    const next = locale === "en" ? "zh" : "en";
    router.replace(pathname, { locale: next });
  }

  function handleLogout() {
    document.cookie = "cf_session=; path=/; max-age=0";
    router.push("/");
  }

  return (
    <header className="site-header">
      <Link href={isLoggedIn ? (isAdmin ? "/admin" : "/resources") : "/"} className="site-logo">
        CampusForge
      </Link>
      <nav className="site-nav">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            data-active={pathname === item.href}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button
          onClick={switchLocale}
          className="btn btn-ghost btn-sm"
          style={{ minWidth: 44 }}
        >
          {locale === "en" ? "中文" : "EN"}
        </button>
        {isLoggedIn && (
          <button onClick={handleLogout} className="btn btn-ghost btn-sm">
            {t("common.logout")}
          </button>
        )}
      </div>
    </header>
  );
}
