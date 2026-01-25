"use client";

import { ListChecks, Menu } from "lucide-react";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Drawer } from "./Drawer";
import styles from "./CompactNav.module.css";

const navItems = [
  {
    id: "records",
    label: "기록",
    href: "/records",
    icon: ListChecks,
  },
];

export default function CompactNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  return (
    <>
      <button
        type="button"
        className={styles.menuButton}
        onClick={() => setOpen(true)}
        aria-label="메뉴 열기"
      >
        <Menu size={20} />
      </button>

      <Drawer open={open} onClose={() => setOpen(false)} side="left" width={340}>
        <div className={styles.drawerHeader}>
          <button
            type="button"
            className={styles.closeButton}
            onClick={() => setOpen(false)}
            aria-label="닫기"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>

        <div className={styles.drawerList}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <button
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
              </button>
            );
          })}
        </div>
      </Drawer>
    </>
  );
}
