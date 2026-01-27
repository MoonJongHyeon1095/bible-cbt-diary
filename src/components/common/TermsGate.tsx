"use client";

import { TERMS_STORAGE_KEY, TERMS_VERSION } from "@/lib/constants/legal";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

type StoredAgreement = {
  version: number;
  acceptedAt: string;
  terms: boolean;
  privacy: boolean;
  consent: boolean;
  ageConfirmed: boolean;
  aiTransfer: boolean;
};

const EXEMPT_PATHS = ["/terms", "/privacy", "/terms-of-service"];

function hasAcceptedTerms(): boolean {
  if (typeof window === "undefined") return true;
  const raw = window.localStorage.getItem(TERMS_STORAGE_KEY);
  if (!raw) return false;
  try {
    const parsed = JSON.parse(raw) as StoredAgreement;
    return (
      parsed.version === TERMS_VERSION &&
      parsed.terms &&
      parsed.privacy &&
      parsed.consent &&
      parsed.ageConfirmed &&
      parsed.aiTransfer
    );
  } catch {
    return false;
  }
}

export default function TermsGate() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (EXEMPT_PATHS.includes(pathname)) return;
    if (hasAcceptedTerms()) return;
    router.replace("/terms");
  }, [pathname, router]);

  return null;
}
