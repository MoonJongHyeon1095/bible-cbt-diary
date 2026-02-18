"use client";

import { useAuthModal } from "@/components/header/AuthModalProvider";
import { useAccessContext } from "@/lib/hooks/useAccessContext";
import { CalendarDays, Footprints, Home, Waypoints, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type MouseEvent } from "react";
import styles from "./AppTabs.module.css";

export default function AppTabs() {
  const pathname = usePathname();
  const { openAuthModal } = useAuthModal();
  const { isBlocked } = useAccessContext();
  const bottomNavRef = useRef<HTMLElement | null>(null);
  const tabs = [
    { href: "/home", label: "홈", icon: Home },
    { href: "/list", label: "기록", icon: CalendarDays },
    { href: "/flow/list", label: "Flow", icon: Waypoints },
    { href: "/behavior", label: "행동", icon: Footprints },
    { href: "/search", label: "검색", icon: Search },
  ];

  useEffect(() => {
    const navElement = bottomNavRef.current;
    if (!navElement) return;

    const applyBottomInset = () => {
      const viewport = window.visualViewport;
      if (!viewport) {
        navElement.style.removeProperty("--tab-nav-safe-bottom");
        return;
      }
      const bottomInset = Math.max(
        0,
        Math.round(window.innerHeight - viewport.height - viewport.offsetTop),
      );
      navElement.style.setProperty("--tab-nav-safe-bottom", `${bottomInset}px`);
    };

    applyBottomInset();
    window.addEventListener("resize", applyBottomInset);
    window.visualViewport?.addEventListener("resize", applyBottomInset);
    window.visualViewport?.addEventListener("scroll", applyBottomInset);

    return () => {
      window.removeEventListener("resize", applyBottomInset);
      window.visualViewport?.removeEventListener("resize", applyBottomInset);
      window.visualViewport?.removeEventListener("scroll", applyBottomInset);
    };
  }, []);
  const handleTabClick = (href: string) => (event: MouseEvent) => {
    if (href === "/flow/list" && isBlocked) {
      event.preventDefault();
      openAuthModal();
      return;
    }
    if (href === "/home" && (pathname === "/" || pathname === "/home")) {
      event.preventDefault();
      window.dispatchEvent(new CustomEvent("app:home-tab-reset"));
    }
  };

  const isActiveTab = (href: string) => {
    if (href === "/home" && pathname === "/") return true;
    if (href === "/behavior") return pathname.startsWith("/behavior");
    if (href === "/flow/list") return pathname.startsWith("/flow");
    return pathname === href;
  };

  return (
    <>
      <nav className={styles.topNav}>
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={styles.tabButton}
            aria-current={isActiveTab(tab.href) ? "page" : undefined}
            onClick={handleTabClick(tab.href)}
          >
            <tab.icon size={16} aria-hidden className={styles.tabIcon} />
            {tab.label}
          </Link>
        ))}
      </nav>
      <nav ref={bottomNavRef} className={styles.bottomNav}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={styles.tabButton}
              aria-current={isActiveTab(tab.href) ? "page" : undefined}
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
