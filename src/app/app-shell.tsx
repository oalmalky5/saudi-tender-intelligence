"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { pick, type Locale } from "@/lib/i18n/locale";

import { LanguageSwitcher } from "./language-switcher";

type IconName =
  | "discover"
  | "recommended"
  | "saved"
  | "chat"
  | "notifications"
  | "report"
  | "company";

const navigation: Array<{
  href: string;
  icon: IconName;
  label: [string, string];
  active: (pathname: string) => boolean;
}> = [
  {
    href: "/tenders",
    icon: "discover",
    label: ["Discover", "اكتشاف"],
    active: (path) => path === "/tenders" || path.startsWith("/tenders/"),
  },
  {
    href: "/tenders/recommended",
    icon: "recommended",
    label: ["Matches", "المطابقات"],
    active: (path) => path.startsWith("/tenders/recommended"),
  },
  {
    href: "/tenders/saved",
    icon: "saved",
    label: ["Decisions", "القرارات"],
    active: (path) => path.startsWith("/tenders/saved"),
  },
  {
    href: "/chat",
    icon: "chat",
    label: ["Ask AI", "اسأل الذكاء"],
    active: (path) => path.startsWith("/chat"),
  },
  {
    href: "/notifications",
    icon: "notifications",
    label: ["Signals", "الإشارات"],
    active: (path) => path.startsWith("/notifications"),
  },
  {
    href: "/reports/weekly",
    icon: "report",
    label: ["Briefs", "الموجزات"],
    active: (path) => path.startsWith("/reports"),
  },
  {
    href: "/company",
    icon: "company",
    label: ["Profile", "الملف"],
    active: (path) => path.startsWith("/company"),
  },
];

function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, React.ReactNode> = {
    discover: <><circle cx="11" cy="11" r="6" /><path d="m16 16 4 4M11 8v6M8 11h6" /></>,
    recommended: <><path d="m12 3 2.2 4.5 4.8.7-3.5 3.4.8 4.9-4.3-2.3-4.3 2.3.8-4.9L5 8.2l4.8-.7L12 3Z" /></>,
    saved: <><path d="M6 4h12v16l-6-3.8L6 20V4Z" /></>,
    chat: <><path d="M5 5h14v10H9l-4 4V5Z" /><path d="M9 9h6M9 12h4" /></>,
    notifications: <><path d="M6.5 16h11l-1.5-2V9a4 4 0 0 0-8 0v5l-1.5 2Z" /><path d="M10 19h4" /></>,
    report: <><path d="M6 3h9l3 3v15H6V3Z" /><path d="M15 3v4h4M9 11h6M9 15h6" /></>,
    company: <><circle cx="12" cy="8" r="3" /><path d="M6 20v-2a6 6 0 0 1 12 0v2" /></>,
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

export function AppShell({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <aside className="app-sidebar">
        <Link href="/tenders" className="brand-mark" aria-label="Etimad Intelligence">
          <span className="brand-orbit"><span /></span>
          <span className="brand-copy">
            <strong>Etimad</strong>
            <small>Intelligence</small>
          </span>
        </Link>

        <nav className="app-nav" aria-label={pick(locale, "Main navigation", "التنقل الرئيسي")}>
          {navigation.map((item) => {
            const active =
              item.active(pathname) &&
              !(
                item.href === "/tenders" &&
                (pathname.startsWith("/tenders/recommended") ||
                  pathname.startsWith("/tenders/saved"))
              );
            return (
              <Link
                key={item.href}
                href={item.href}
                className="app-nav-link"
                data-active={active || undefined}
                aria-current={active ? "page" : undefined}
              >
                <span className="nav-icon"><Icon name={item.icon} /></span>
                <span>{pick(locale, item.label[0], item.label[1])}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-foot">
          <Link href="/admin/import" className="admin-link">
            <span className="status-dot" />
            {pick(locale, "Data tools", "أدوات البيانات")}
          </Link>
          <LanguageSwitcher locale={locale} />
        </div>
      </aside>

      <header className="mobile-topbar">
        <Link href="/tenders" className="brand-mark" aria-label="Etimad Intelligence">
          <span className="brand-orbit"><span /></span>
          <span className="brand-copy"><strong>Etimad</strong><small>Intelligence</small></span>
        </Link>
        <LanguageSwitcher locale={locale} />
      </header>

      <div className="app-content">{children}</div>

      <nav className="mobile-dock" aria-label={pick(locale, "Mobile navigation", "تنقل الجوال")}>
        {navigation.slice(0, 6).map((item) => {
          const active =
            item.active(pathname) &&
            !(
              item.href === "/tenders" &&
              (pathname.startsWith("/tenders/recommended") ||
                pathname.startsWith("/tenders/saved"))
            );
          return (
            <Link key={item.href} href={item.href} data-active={active || undefined} aria-label={pick(locale, item.label[0], item.label[1])}>
              <Icon name={item.icon} />
              <span>{pick(locale, item.label[0], item.label[1])}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
