 "use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, ChartColumn, Home, ListChecks, Sun } from "lucide-react";
import styles from "./AppTabs.module.css";

export default function AppTabs() {
  const pathname = usePathname();
  const tabs = [
    { href: "/", label: "홈", icon: Home },
    { href: "/today", label: "오늘", icon: Sun },
    { href: "/month", label: "월별", icon: CalendarDays },
    { href: "/records", label: "기록", icon: ListChecks },
    { href: "/stats", label: "통계", icon: ChartColumn },
  ];

  return (
    <>
      <nav className={styles.topNav}>
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={styles.tabButton}
            aria-current={pathname === tab.href ? "page" : undefined}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      <nav className={styles.bottomNav}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={styles.tabButton}
              aria-current={pathname === tab.href ? "page" : undefined}
            >
              <Icon size={18} aria-hidden />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
