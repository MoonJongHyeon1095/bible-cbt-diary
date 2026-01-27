"use client";

import {
  CbtToastProvider,
  useCbtToast,
} from "@/components/cbt/common/CbtToast";
import Button from "@/components/ui/Button";
import { TERMS_STORAGE_KEY, TERMS_VERSION } from "@/lib/constants/legal";
import ConsentFormContent from "@/components/legal/ConsentFormContent";
import PrivacyPolicyContent from "@/components/legal/PrivacyPolicyContent";
import TermsOfServiceContent from "@/components/legal/TermsOfServiceContent";
import { ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import styles from "../legal/LegalPage.module.css";

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

export default function TermsPage() {
  return (
    <CbtToastProvider>
      <TermsPageContent />
    </CbtToastProvider>
  );
}

function TermsPageContent() {
  const router = useRouter();
  const { pushToast } = useCbtToast();
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeConsent, setAgreeConsent] = useState(false);
  const [agreeAge, setAgreeAge] = useState(false);
  const [agreeAi, setAgreeAi] = useState(false);
  const [agreeMarketing, setAgreeMarketing] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [openedSections, setOpenedSections] = useState<{
    terms: boolean;
    privacy: boolean;
    consent: boolean;
  }>({
    terms: false,
    privacy: false,
    consent: false,
  });

  const handleToggleSection = (key: "terms" | "privacy" | "consent") => {
    setOpenSection((prev) => (prev === key ? null : key));
    setOpenedSections((prev) => ({ ...prev, [key]: true }));
  };
  const openSectionAndMark = (key: "terms" | "privacy" | "consent") => {
    setOpenSection(key);
    setOpenedSections((prev) => ({ ...prev, [key]: true }));
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(TERMS_STORAGE_KEY);
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

  const canSubmit = useMemo(
    () => agreeTerms && agreePrivacy && agreeConsent && agreeAge && agreeAi,
    [agreeTerms, agreePrivacy, agreeConsent, agreeAge, agreeAi],
  );

  const handleBlockedClick = (key: "terms" | "privacy" | "consent") => {
    if (openedSections[key]) return;
    const label =
      key === "terms"
        ? "이용약관"
        : key === "privacy"
          ? "개인정보 처리방침"
          : "개인정보 수집·이용 동의서";
    pushToast(`${label}을(를) 먼저 확인해주세요.`, "error");
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
    window.localStorage.setItem(TERMS_STORAGE_KEY, JSON.stringify(payload));
    router.replace("/today");
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.shell}>
          <section>
            <h1 className={styles.title}>이용약관 및 동의</h1>
            <p className={styles.subtitle}>
              서비스 이용을 위해 아래 약관에 동의해주세요.
            </p>
          </section>

          <section className={styles.accordion}>
            <div className={styles.accordionItem}>
              <button
                type="button"
                className={styles.accordionButton}
                onClick={() => handleToggleSection("terms")}
              >
                <strong>이용약관 (Terms of Service)</strong>
                <span>{openSection === "terms" ? "접기" : "펼치기"}</span>
              </button>
              {openSection === "terms" && (
                <div className={styles.accordionContent}>
                  <TermsOfServiceContent />
                </div>
              )}
            </div>

            <div className={styles.accordionItem}>
              <button
                type="button"
                className={styles.accordionButton}
                onClick={() => handleToggleSection("privacy")}
              >
                <strong>개인정보 처리방침</strong>
                <span>{openSection === "privacy" ? "접기" : "펼치기"}</span>
              </button>
              {openSection === "privacy" && (
                <div className={styles.accordionContent}>
                  <PrivacyPolicyContent />
                </div>
              )}
            </div>

            <div className={styles.accordionItem}>
              <button
                type="button"
                className={styles.accordionButton}
                onClick={() => handleToggleSection("consent")}
              >
                <strong>개인정보 수집·이용 동의서</strong>
                <span>{openSection === "consent" ? "접기" : "펼치기"}</span>
              </button>
              {openSection === "consent" && (
                <div className={styles.accordionContent}>
                  <ConsentFormContent />
                </div>
              )}
            </div>
          </section>
          <div className={styles.agreeList}>
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
              <label
                className={styles.agreeItem}
                onClick={(event) => {
                  if (openedSections.terms) return;
                  event.preventDefault();
                  handleBlockedClick("terms");
                }}
              >
                <input
                  type="checkbox"
                  className={styles.checkboxInput}
                  checked={agreeTerms}
                  disabled={!openedSections.terms}
                  onChange={(event) => setAgreeTerms(event.target.checked)}
                />
                <span>
                  <span className={styles.agreeBadge}>필수</span>
                  이용약관에 동의합니다.
                </span>
              </label>
              <button
                type="button"
                className={styles.viewButton}
                onClick={() => openSectionAndMark("terms")}
                aria-label="이용약관 보기"
              >
                <ChevronRight size={14} />
              </button>
            </div>
            <div className={styles.agreeRow}>
              <label
                className={styles.agreeItem}
                onClick={(event) => {
                  if (openedSections.privacy) return;
                  event.preventDefault();
                  handleBlockedClick("privacy");
                }}
              >
                <input
                  type="checkbox"
                  className={styles.checkboxInput}
                  checked={agreePrivacy}
                  disabled={!openedSections.privacy}
                  onChange={(event) => setAgreePrivacy(event.target.checked)}
                />
                <span>
                  <span className={styles.agreeBadge}>필수</span>
                  개인정보 처리방침에 동의합니다.
                </span>
              </label>
              <button
                type="button"
                className={styles.viewButton}
                onClick={() => openSectionAndMark("privacy")}
                aria-label="개인정보 처리방침 보기"
              >
                <ChevronRight size={14} />
              </button>
            </div>
            <div className={styles.agreeRow}>
              <label
                className={styles.agreeItem}
                onClick={(event) => {
                  if (openedSections.consent) return;
                  event.preventDefault();
                  handleBlockedClick("consent");
                }}
              >
                <input
                  type="checkbox"
                  className={styles.checkboxInput}
                  checked={agreeConsent}
                  disabled={!openedSections.consent}
                  onChange={(event) => setAgreeConsent(event.target.checked)}
                />
                <span>
                  <span className={styles.agreeBadge}>필수</span>
                  개인정보 수집·이용 동의서에 동의합니다.
                </span>
              </label>
              <button
                type="button"
                className={styles.viewButton}
                onClick={() => openSectionAndMark("consent")}
                aria-label="개인정보 수집·이용 동의서 보기"
              >
                <ChevronRight size={14} />
              </button>
            </div>
            <div className={styles.agreeRow}>
              <label
                className={styles.agreeItem}
                onClick={(event) => {
                  if (openedSections.consent) return;
                  event.preventDefault();
                  handleBlockedClick("consent");
                }}
              >
                <input
                  type="checkbox"
                  className={styles.checkboxInput}
                  checked={agreeAi}
                  disabled={!openedSections.consent}
                  onChange={(event) => setAgreeAi(event.target.checked)}
                />
                <span className={styles.agreeTextWrap}>
                  <span className={styles.agreeBadge}>필수</span>
                  AI 기능 이용 및 국외 이전 안내에 동의합니다.
                </span>
              </label>
              <button
                type="button"
                className={styles.viewButton}
                onClick={() => openSectionAndMark("consent")}
                aria-label="개인정보 수집·이용 동의서 보기"
              >
                <ChevronRight size={14} />
              </button>
            </div>
            <div className={styles.agreeRow}>
              <label
                className={styles.agreeItem}
                onClick={(event) => {
                  if (openedSections.consent) return;
                  event.preventDefault();
                  handleBlockedClick("consent");
                }}
              >
                <input
                  type="checkbox"
                  className={styles.checkboxInput}
                  checked={agreeMarketing}
                  disabled={!openedSections.consent}
                  onChange={(event) => setAgreeMarketing(event.target.checked)}
                />
                <span>
                  <span className={styles.agreeBadgeOptional}>선택</span>
                  마케팅 정보 수신에 동의합니다.
                </span>
              </label>
              <button
                type="button"
                className={styles.viewButton}
                onClick={() => openSectionAndMark("consent")}
                aria-label="개인정보 수집·이용 동의서 보기"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
          <div className={styles.actions}>
            {canSubmit ? (
              <Button type="button" variant="primary" onClick={handleSubmit}>
                동의하고 시작하기
              </Button>
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
