import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteHeader } from "./components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  title: "CampusForge",
  description: "School open-source community platform.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
