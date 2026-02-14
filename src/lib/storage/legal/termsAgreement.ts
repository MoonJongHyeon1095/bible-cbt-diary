import { TERMS_VERSION } from "@/lib/constants/legal";
import { safeLocalStorage } from "@/lib/storage/core/safeStorage";
import { TERMS_STORAGE_KEY } from "@/lib/storage/keys/legal";

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
  if (!safeLocalStorage.isAvailable()) return true;
  const raw = safeLocalStorage.getItem(TERMS_STORAGE_KEY);
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
