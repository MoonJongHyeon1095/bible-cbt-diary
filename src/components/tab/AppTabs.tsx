"use client";

import { useAuthModal } from "@/components/header/AuthModalProvider";
import { useAccessContext } from "@/lib/hooks/useAccessContext";
import { CalendarDays, Home, Waypoints, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MouseEvent } from "react";
import styles from "./AppTabs.module.css";

export default function AppTabs() {
  const pathname = usePathname();
  const { openAuthModal } = useAuthModal();
  const { isBlocked } = useAccessContext();
  const tabs = [
    { href: "/home", label: "홈", icon: Home },
    { href: "/list", label: "기록", icon: CalendarDays },
    { href: "/search", label: "검색", icon: Search },
    { href: "/flow", label: "Flow", icon: Waypoints },
  ];
  const handleTabClick = (href: string) => (event: MouseEvent) => {
    if (href !== "/flow") return;
    if (!isBlocked) return;
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
            aria-current={
              pathname === tab.href || (tab.href === "/home" && pathname === "/")
                ? "page"
                : undefined
            }
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
              aria-current={
                pathname === tab.href || (tab.href === "/home" && pathname === "/")
                  ? "page"
                  : undefined
              }
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
