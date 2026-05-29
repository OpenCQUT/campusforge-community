"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";

function useIsLoggedIn(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.includes("cf_session=");
}

export function SiteHeader() {
  const pathname = usePathname();
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const isLoggedIn = useIsLoggedIn();

  const publicNav = [
    { href: "/apply", label: t("nav.apply") },
    { href: "/status", label: t("nav.status") },
  ];

  const protectedNav = [
    { href: "/resources", label: t("nav.resources") },
    { href: "/courses", label: t("nav.courses") },
    { href: "/policies", label: t("nav.policies") },
    { href: "/admin", label: t("nav.admin") },
  ];

  const navItems = isLoggedIn
    ? [...protectedNav]
    : [...publicNav];

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
      <Link href={isLoggedIn ? "/resources" : "/"} className="site-logo">
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
