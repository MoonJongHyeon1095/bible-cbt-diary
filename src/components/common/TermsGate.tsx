"use client";

import { hasAcceptedTerms } from "@/lib/utils/terms";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useGate } from "@/components/notice/GateProvider";

const EXEMPT_PATHS = [
  "/terms",
  "/privacy",
  "/terms-of-service",
  "/account-deletion",
  "/share",
];

export default function TermsGate() {
  const pathname = usePathname();
  const router = useRouter();
  const { setTermsStatus } = useGate();

  useEffect(() => {
    if (!pathname) return;

    const accepted = hasAcceptedTerms();
    setTermsStatus({ blocking: !accepted, ready: true });

    if (EXEMPT_PATHS.includes(pathname)) return;
    if (accepted) return;
    router.replace("/terms");
  }, [pathname, router, setTermsStatus]);

  return null;
}
