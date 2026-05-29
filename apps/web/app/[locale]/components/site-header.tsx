"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

export function SiteHeader() {
  const pathname = usePathname();
  const t = useTranslations("nav");

  const navItems = [
    { href: "/", label: t("home") },
    { href: "/apply", label: t("apply") },
    { href: "/status", label: t("status") },
    { href: "/resources", label: t("resources") },
    { href: "/courses", label: t("courses") },
    { href: "/policies", label: t("policies") },
    { href: "/admin", label: t("admin") },
  ];

  return (
    <header className="site-header">
      <Link href="/" className="site-logo">
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
    </header>
  );
}
