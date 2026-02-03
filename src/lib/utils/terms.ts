import { TERMS_STORAGE_KEY, TERMS_VERSION } from "@/lib/constants/legal";

type StoredAgreement = {
  version: number;
  acceptedAt: string;
  terms: boolean;
  privacy: boolean;
  consent: boolean;
  ageConfirmed: boolean;
  aiTransfer: boolean;
};

export function hasAcceptedTerms(): boolean {
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
