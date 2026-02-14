"use client";

import { safeLocalStorage } from "@/lib/storage/core/safeStorage";
import { ENTRANCE_COMPLETED_KEY } from "@/lib/storage/keys/entrance";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

const EXEMPT_PATHS = [
  "/entrance",
  "/terms",
  "/privacy",
  "/terms-of-service",
  "/account-deletion",
  "/share",
];

export default function EntranceGate() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!pathname) return;
    if (EXEMPT_PATHS.includes(pathname)) return;
    if (!safeLocalStorage.isAvailable()) return;

    const completed =
      safeLocalStorage.getItem(ENTRANCE_COMPLETED_KEY) === "true";
    if (completed) return;

    const frame = window.requestAnimationFrame(() => {
      router.replace("/entrance");
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [pathname, router]);

  return null;
}
