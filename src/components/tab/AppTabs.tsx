"use client";

import { CalendarDays, Home, Sun, Waypoints } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MouseEvent } from "react";
import { useAuthModal } from "@/components/header/AuthModalProvider";
import { useAccessContext } from "@/lib/hooks/useAccessContext";
import styles from "./AppTabs.module.css";

export default function AppTabs() {
  const pathname = usePathname();
  const { openAuthModal } = useAuthModal();
  const { isAuthenticated } = useAccessContext();
  const tabs = [
    { href: "/", label: "홈", icon: Home },
    { href: "/today", label: "오늘", icon: Sun },
    { href: "/month", label: "월별", icon: CalendarDays },
    { href: "/graph", label: "그래프", icon: Waypoints },
  ];
  const handleTabClick = (href: string) => (event: MouseEvent) => {
    if (href !== "/graph") return;
    if (isAuthenticated) return;
    event.preventDefault();
    openAuthModal();
  };

  return (
    <>
      <nav className={styles.topNav}>
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={styles.tabButton}
            aria-current={pathname === tab.href ? "page" : undefined}
            onClick={handleTabClick(tab.href)}
          >
            <tab.icon size={16} aria-hidden className={styles.tabIcon} />
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
              onClick={handleTabClick(tab.href)}
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
