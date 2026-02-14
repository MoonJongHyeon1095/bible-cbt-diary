"use client";

import LegalConsentFormContent from "@/components/legal/LegalConsentFormContent";
import styles from "@/components/legal/LegalPage.module.css";
import LegalPrivacyPolicyContent from "@/components/legal/LegalPrivacyPolicyContent";
import LegalTermsOfServiceContent from "@/components/legal/LegalTermsOfServiceContent";
import SafeButton from "@/components/ui/SafeButton";
import {
  TERMS_COOKIE_KEY,
  TERMS_STORAGE_KEY,
  TERMS_VERSION,
} from "@/lib/constants/legal";
import { safeLocalStorage } from "@/lib/storage/core/safeStorage";
import { ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type StoredAgreement = {
  version: number;
  acceptedAt: string;
  terms: boolean;
  privacy: boolean;
  consent: boolean;
  ageConfirmed: boolean;
  aiTransfer: boolean;
  marketing: boolean;
};

export default function LegalTermsConsentPage() {
  const router = useRouter();
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeConsent, setAgreeConsent] = useState(false);
  const [agreeAge, setAgreeAge] = useState(false);
  const [agreeAi, setAgreeAi] = useState(false);
  const [agreeMarketing, setAgreeMarketing] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null);

  const handleToggleSection = (key: "terms" | "privacy" | "consent") => {
    setOpenSection((prev) => (prev === key ? null : key));
  };

  useEffect(() => {
    const raw = safeLocalStorage.getItem(TERMS_STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as StoredAgreement;
      if (parsed.version !== TERMS_VERSION) return;
      setAgreeTerms(Boolean(parsed.terms));
      setAgreePrivacy(Boolean(parsed.privacy));
      setAgreeConsent(Boolean(parsed.consent));
      setAgreeAge(Boolean(parsed.ageConfirmed));
      setAgreeAi(Boolean(parsed.aiTransfer));
      setAgreeMarketing(Boolean(parsed.marketing));
    } catch {
      // ignore invalid stored state
    }
  }, []);

  const allAgreed = useMemo(
    () => agreeTerms && agreePrivacy && agreeConsent && agreeAge && agreeAi,
    [agreeTerms, agreePrivacy, agreeConsent, agreeAge, agreeAi],
  );
  const canSubmit = allAgreed;
  const handleAgreeAll = (checked: boolean) => {
    setAgreeTerms(checked);
    setAgreePrivacy(checked);
    setAgreeConsent(checked);
    setAgreeAge(checked);
    setAgreeAi(checked);
    setAgreeMarketing(checked);
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    const payload: StoredAgreement = {
      version: TERMS_VERSION,
      acceptedAt: new Date().toISOString(),
      terms: agreeTerms,
      privacy: agreePrivacy,
      consent: agreeConsent,
      ageConfirmed: agreeAge,
      aiTransfer: agreeAi,
      marketing: agreeMarketing,
    };
    safeLocalStorage.setItem(TERMS_STORAGE_KEY, JSON.stringify(payload));
    const secure = window.location.protocol === "https:" ? "; secure" : "";
    document.cookie = `${TERMS_COOKIE_KEY}=v${TERMS_VERSION}; path=/; max-age=31536000; samesite=lax${secure}`;
    router.replace("/today");
  };

  return (
    <div className={styles.page}>
      <main className={`${styles.main} ${styles.consentMain}`}>
        <div className={`${styles.shell} ${styles.consentShell}`}>
          <section>
            <h1 className={styles.title}>이용약관 및 동의</h1>
            <p className={styles.subtitle}>
              서비스 이용을 위해 아래 약관에 동의해주세요.
            </p>
          </section>

          <section className={styles.accordion}>
            <div className={styles.accordionItem}>
              <SafeButton mode="native"
                type="button"
                className={styles.accordionButton}
                onClick={() => handleToggleSection("terms")}
              >
                <strong>이용약관 (Terms of Service)</strong>
                <span>{openSection === "terms" ? "접기" : "펼치기"}</span>
              </SafeButton>
              {openSection === "terms" && (
                <div className={`${styles.accordionContent} ${styles.legalBody}`}>
                  <LegalTermsOfServiceContent />
                </div>
              )}
            </div>

            <div className={styles.accordionItem}>
              <SafeButton mode="native"
                type="button"
                className={styles.accordionButton}
                onClick={() => handleToggleSection("privacy")}
              >
                <strong>개인정보 처리방침</strong>
                <span>{openSection === "privacy" ? "접기" : "펼치기"}</span>
              </SafeButton>
              {openSection === "privacy" && (
                <div className={`${styles.accordionContent} ${styles.legalBody}`}>
                  <LegalPrivacyPolicyContent />
                </div>
              )}
            </div>

            <div className={styles.accordionItem}>
              <SafeButton mode="native"
                type="button"
                className={styles.accordionButton}
                onClick={() => handleToggleSection("consent")}
              >
                <strong>개인정보 수집·이용 동의서</strong>
                <span>{openSection === "consent" ? "접기" : "펼치기"}</span>
              </SafeButton>
              {openSection === "consent" && (
                <div className={`${styles.accordionContent} ${styles.legalBody}`}>
                  <LegalConsentFormContent />
                </div>
              )}
            </div>
          </section>
          <div className={styles.agreeList}>
            <div className={styles.agreeRow}>
              <label className={`${styles.agreeItem} ${styles.agreeAllItem}`}>
                <input
                  type="checkbox"
                  className={styles.checkboxInput}
                  checked={allAgreed}
                  onChange={(event) => handleAgreeAll(event.target.checked)}
                />
                <span className={styles.agreeAllText}>
                  전체 동의
                  <span className={styles.agreeAllSub}>
                    아래 필수 항목에 모두 동의합니다.
                  </span>
                </span>
              </label>
            </div>
            <div className={styles.agreeRow}>
              <label className={styles.agreeItem}>
                <input
                  type="checkbox"
                  className={styles.checkboxInput}
                  checked={agreeAge}
                  onChange={(event) => setAgreeAge(event.target.checked)}
                />
                <span>
                  <span className={styles.agreeBadge}>필수</span>만 18세
                  이상입니다.
                </span>
              </label>
            </div>
            <div className={styles.agreeRow}>
              <label className={styles.agreeItem}>
                <input
                  type="checkbox"
                  className={styles.checkboxInput}
                  checked={agreeTerms}
                  onChange={(event) => setAgreeTerms(event.target.checked)}
                />
                <span>
                  <span className={styles.agreeBadge}>필수</span>
                  이용약관에 동의합니다.
                </span>
              </label>
              <SafeButton mode="native"
                type="button"
                className={styles.viewButton}
                onClick={() => setOpenSection("terms")}
                aria-label="이용약관 보기"
              >
                <ChevronRight size={14} />
              </SafeButton>
            </div>
            <div className={styles.agreeRow}>
              <label className={styles.agreeItem}>
                <input
                  type="checkbox"
                  className={styles.checkboxInput}
                  checked={agreePrivacy}
                  onChange={(event) => setAgreePrivacy(event.target.checked)}
                />
                <span>
                  <span className={styles.agreeBadge}>필수</span>
                  개인정보 처리방침에 동의합니다.
                </span>
              </label>
              <SafeButton mode="native"
                type="button"
                className={styles.viewButton}
                onClick={() => setOpenSection("privacy")}
                aria-label="개인정보 처리방침 보기"
              >
                <ChevronRight size={14} />
              </SafeButton>
            </div>
            <div className={styles.agreeRow}>
              <label className={styles.agreeItem}>
                <input
                  type="checkbox"
                  className={styles.checkboxInput}
                  checked={agreeConsent}
                  onChange={(event) => setAgreeConsent(event.target.checked)}
                />
                <span>
                  <span className={styles.agreeBadge}>필수</span>
                  개인정보 수집·이용 동의서에 동의합니다.
                </span>
              </label>
              <SafeButton mode="native"
                type="button"
                className={styles.viewButton}
                onClick={() => setOpenSection("consent")}
                aria-label="개인정보 수집·이용 동의서 보기"
              >
                <ChevronRight size={14} />
              </SafeButton>
            </div>
            <div className={styles.agreeRow}>
              <label className={styles.agreeItem}>
                <input
                  type="checkbox"
                  className={styles.checkboxInput}
                  checked={agreeAi}
                  onChange={(event) => setAgreeAi(event.target.checked)}
                />
                <span className={styles.agreeTextWrap}>
                  <span className={styles.agreeBadge}>필수</span>
                  AI 기능 이용 및 국외 이전 안내에 동의합니다.
                </span>
              </label>
              <SafeButton mode="native"
                type="button"
                className={styles.viewButton}
                onClick={() => setOpenSection("consent")}
                aria-label="개인정보 수집·이용 동의서 보기"
              >
                <ChevronRight size={14} />
              </SafeButton>
            </div>
          </div>
          <div className={styles.actions}>
            {canSubmit ? (
              <SafeButton type="button" variant="primary" onClick={handleSubmit}>
                동의하고 시작하기
              </SafeButton>
            ) : (
              <p className={styles.agreeHint}>
                필수 항목에 모두 동의해야 시작할 수 있습니다.
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
