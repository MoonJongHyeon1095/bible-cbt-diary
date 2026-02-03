"use client";

import {
  FileText,
  ListChecks,
  Menu,
  ShieldCheck,
  SignalHigh,
  UserMinus,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./CompactNav.module.css";
import { Drawer } from "./Drawer";
import SafeButton from "@/components/ui/SafeButton";

const navItems = [
  {
    id: "records",
    label: "기록",
    href: "/records",
    icon: ListChecks,
  },
];

const settingsItems = [
  {
    id: "terms",
    label: "이용약관",
    href: "/terms-of-service",
    icon: FileText,
  },
  {
    id: "privacy",
    label: "개인정보처리방침",
    href: "/privacy",
    icon: ShieldCheck,
  },
  {
    id: "account-deletion",
    label: "삭제 안내",
    href: "/account-deletion",
    icon: UserMinus,
  },
];

const usageItems = [
  {
    id: "usage",
    label: "사용량 조회",
    href: "/usage",
    icon: SignalHigh,
  },
];

type CompactNavProps = {
  userEmail: string | null;
};

export default function CompactNav({ userEmail }: CompactNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  return (
    <>
      <SafeButton mode="native"
        type="button"
        className={styles.menuButton}
        onClick={() => setOpen(true)}
        aria-label="메뉴 열기"
      >
        <Menu size={20} />
      </SafeButton>

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        side="left"
        width={300}
      >
        <div className={styles.drawerHeader}>
          {userEmail ? (
            <span className={styles.userEmail}>{userEmail}</span>
          ) : (
            <span />
          )}
          <SafeButton mode="native"
            type="button"
            className={styles.closeButton}
            onClick={() => setOpen(false)}
            aria-label="닫기"
          >
            <span aria-hidden="true">×</span>
          </SafeButton>
        </div>

        <div className={styles.drawerList}>
          <div className={styles.drawerSection}>
            <span className={styles.drawerSectionTitle}>HISTORY</span>
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <SafeButton mode="native"
                  key={item.id}
                  type="button"
                  className={`${styles.drawerItem} ${
                    active ? styles.drawerItemActive : ""
                  }`}
                  onClick={() => {
                    setOpen(false);
                    router.push(item.href);
                  }}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </SafeButton>
              );
            })}
          </div>
          <div className={styles.drawerSection}>
            <span className={styles.drawerSectionTitle}>USAGE</span>
            {usageItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <SafeButton mode="native"
                  key={item.id}
                  type="button"
                  className={`${styles.drawerItem} ${
                    active ? styles.drawerItemActive : ""
                  }`}
                  onClick={() => {
                    setOpen(false);
                    router.push(item.href);
                  }}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </SafeButton>
              );
            })}
          </div>
          <div className={styles.drawerSection}>
            <span className={styles.drawerSectionTitle}>POLICY</span>
            {settingsItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <SafeButton mode="native"
                  key={item.id}
                  type="button"
                  className={`${styles.drawerItem} ${
                    active ? styles.drawerItemActive : ""
                  }`}
                  onClick={() => {
                    setOpen(false);
                    router.push(item.href);
                  }}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </SafeButton>
              );
            })}
          </div>
        </div>
      </Drawer>
    </>
  );
}
