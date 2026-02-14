"use client";

import { resolveDailyEntryPath } from "@/lib/storage/ui/dailyEntry";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DailyEntryRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace(resolveDailyEntryPath());
  }, [router]);

  return null;
}
