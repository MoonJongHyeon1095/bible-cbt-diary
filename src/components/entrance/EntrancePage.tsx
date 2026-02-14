"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import EntranceOverlay from "@/components/entrance/EntranceOverlay";
import { safeLocalStorage } from "@/lib/storage/core/safeStorage";
import { ENTRANCE_COMPLETED_KEY } from "@/lib/storage/keys/entrance";

export default function EntrancePage() {
  const router = useRouter();

  useEffect(() => {
    if (!safeLocalStorage.isAvailable()) return;
    const completed = safeLocalStorage.getItem(ENTRANCE_COMPLETED_KEY) === "true";
    if (completed) {
      router.replace("/home");
    }
  }, [router]);

  return (
    <EntranceOverlay
      onComplete={() => {
        if (safeLocalStorage.isAvailable()) {
          safeLocalStorage.setItem(ENTRANCE_COMPLETED_KEY, "true");
        }
        router.replace("/home");
      }}
    />
  );
}
