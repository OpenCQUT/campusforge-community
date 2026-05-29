"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/apply", label: "Apply" },
  { href: "/status", label: "Status" },
  { href: "/resources", label: "Resources" },
  { href: "/courses", label: "Courses" },
  { href: "/policies", label: "Policies" },
  { href: "/admin", label: "Admin" },
];

export function SiteHeader() {
  const pathname = usePathname();

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
