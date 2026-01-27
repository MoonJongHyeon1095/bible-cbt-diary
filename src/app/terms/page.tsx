"use client";

import {
  CbtToastProvider,
  useCbtToast,
} from "@/components/cbt/common/CbtToast";
import Button from "@/components/ui/Button";
import { TERMS_STORAGE_KEY, TERMS_VERSION } from "@/lib/constants/legal";
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
                  <h3 className={styles.articleTitle}>제1조(목적)</h3>
                  <p>
                    본 약관은 마인드 렌즈(이하 “회사”)가 제공하는 감정 기록 및
                    자기 성찰을 지원하는 서비스(웹 및 모바일 앱 포함, 이하
                    “서비스”)의 이용과 관련하여 회사와 이용자 간의 권리·의무 및
                    책임사항을 규정함을 목적으로 합니다.
                  </p>

                  <h3 className={styles.articleTitle}>제2조(정의)</h3>
                  <ol className={styles.list}>
                    <li>
                      “이용자”란 본 약관에 동의하고 서비스를 이용하는 자를
                      말합니다(회원 및 비회원 포함).
                    </li>
                    <li>
                      “회원”이란 회사가 정한 절차에 따라 계정을 생성한 이용자를
                      말합니다.
                    </li>
                    <li>
                      “비회원”이란 계정 없이 서비스를 이용하는 자를 말합니다.
                    </li>
                    <li>
                      “콘텐츠”란 이용자가 서비스에 입력하거나 생성하는 감정,
                      생각, 상황, 메모, 질문 응답 등 모든 기록을 말합니다.
                    </li>
                    <li>
                      “AI 기능”이란 이용자 입력을 기반으로 인공지능 모델을
                      활용하여 질문, 요약, 피드백 등을 제공하는 기능을 말합니다.
                    </li>
                  </ol>

                  <h3 className={styles.articleTitle}>
                    제3조(약관의 게시 및 변경)
                  </h3>
                  <ol className={styles.list}>
                    <li>회사는 본 약관을 서비스 내에 게시합니다.</li>
                    <li>
                      회사는 관련 법령을 위반하지 않는 범위에서 약관을 변경할 수
                      있으며, 중요한 변경 시 서비스 내 공지 등 합리적인 방법으로
                      고지합니다.
                    </li>
                    <li>
                      이용자가 변경 약관 시행 이후 서비스를 계속 이용하는 경우
                      변경에 동의한 것으로 봅니다.
                    </li>
                  </ol>

                  <h3 className={styles.articleTitle}>제4조(이용 연령)</h3>
                  <p>본 서비스는 만 18세 이상만 이용할 수 있습니다.</p>

                  <h3 className={styles.articleTitle}>
                    제5조(서비스의 성격 및 의료 고지)
                  </h3>
                  <ol className={styles.list}>
                    <li>
                      본 서비스는 자기이해 및 정서 관리를 돕기 위한 정보 제공 및
                      기록 지원 서비스이며, 의료 서비스 또는 의료기기가
                      아닙니다.
                    </li>
                    <li>
                      회사는 질병, 정신건강 상태 또는 심리적 문제에 대한
                      진단이나 치료를 제공하지 않습니다.
                    </li>
                    <li>
                      AI 기능의 결과물은 참고용 정보이며, 전문가의 판단을
                      대체하지 않습니다.
                    </li>
                    <li>
                      이용자는 건강 또는 심리적 문제가 의심될 경우 반드시 의료
                      또는 상담 전문가의 도움을 받아야 합니다.
                    </li>
                  </ol>

                  <h3 className={styles.articleTitle}>제6조(긴급상황 안내)</h3>
                  <p>
                    자해 또는 자살 충동, 기타 긴급 위험 상황에서는 즉시 119 또는
                    인근 응급기관에 연락해야 하며, 서비스는 긴급 대응 수단이
                    아닙니다.
                  </p>

                  <h3 className={styles.articleTitle}>
                    제7조(회원가입 및 계정)
                  </h3>
                  <ol className={styles.list}>
                    <li>
                      회원가입은 이메일 기반 자체 회원가입 또는 소셜 로그인(예:
                      Google) 방식으로 제공될 수 있습니다.
                    </li>
                    <li>이용자는 정확한 정보를 제공해야 합니다.</li>
                    <li>
                      이용자는 계정 정보의 보안을 유지할 책임이 있으며, 무단
                      사용이 의심되는 경우 즉시 회사에 알려야 합니다.
                    </li>
                  </ol>

                  <h3 className={styles.articleTitle}>
                    제8조(비회원 이용 및 저장 방식)
                  </h3>
                  <ol className={styles.list}>
                    <li>비회원도 일부 기능을 이용할 수 있습니다.</li>
                    <li>
                      비회원의 콘텐츠는 원칙적으로 이용자 기기 내 로컬 저장소에
                      저장되며, 회사 서버에는 저장되지 않을 수 있습니다.
                    </li>
                    <li>
                      기기 변경, 브라우저 데이터 삭제 등으로 인한 콘텐츠 손실에
                      대해 회사는 책임을 지지 않습니다.
                    </li>
                  </ol>

                  <h3 className={styles.articleTitle}>
                    제9조(회원 콘텐츠 저장)
                  </h3>
                  <p>
                    회원의 콘텐츠는 서비스 제공을 위해 회사의 서버 및
                    데이터베이스에 저장될 수 있으며, 삭제 및 보관에 관한 사항은
                    개인정보 처리방침을 따릅니다.
                  </p>

                  <h3 className={styles.articleTitle}>제10조(AI 기능)</h3>
                  <ol className={styles.list}>
                    <li>
                      AI 기능은 서비스의 일부로 제공되며, 이용자는 서비스 이용을
                      위해 해당 기능 이용 및 국외 이전에 동의해야 합니다.
                    </li>
                    <li>
                      AI 기능 이용 시 이용자가 입력한 일부 또는 전부의 텍스트가
                      AI 처리 제공업체(국외 포함)로 전송되어 처리될 수 있습니다.
                    </li>
                    <li>
                      회사는 AI 기능 결과물의 정확성 또는 이용 결과에 대해
                      책임을 지지 않습니다.
                    </li>
                  </ol>

                  <h3 className={styles.articleTitle}>
                    제11조(향후 유료 서비스)
                  </h3>
                  <p>
                    회사는 향후 유료 서비스 또는 구독 기능을 도입할 수 있습니다.
                  </p>
                  <p>
                    이 경우 관련 법령에 따라 결제 및 환불 정책을 별도로 고지하고
                    동의를 받으며, 결제·정산을 위해 필요한 최소한의 개인정보를
                    추가로 수집·이용할 수 있습니다.
                  </p>

                  <h3 className={styles.articleTitle}>제12조(금지행위)</h3>
                  <ul className={styles.list}>
                    <li>타인의 개인정보 또는 계정 도용</li>
                    <li>
                      불법, 혐오, 폭력, 성적 착취, 명예훼손, 괴롭힘 콘텐츠 작성
                    </li>
                    <li>서비스 운영 방해 행위</li>
                    <li>관련 법령 및 본 약관 위반</li>
                  </ul>

                  <h3 className={styles.articleTitle}>
                    제13조(서비스 변경 및 중단)
                  </h3>
                  <p>
                    회사는 운영 또는 기술상 필요에 따라 서비스의 전부 또는
                    일부를 변경하거나 중단할 수 있으며, 중요한 변경 사항은 사전
                    고지합니다.
                  </p>

                  <h3 className={styles.articleTitle}>제14조(지식재산권)</h3>
                  <p>
                    서비스 및 회사 제공 자료에 대한 권리는 회사 또는 정당한
                    권리자에게 귀속되며, 이용자는 서비스 이용 목적 외 사용을 할
                    수 없습니다.
                  </p>

                  <h3 className={styles.articleTitle}>제15조(책임 제한)</h3>
                  <p>
                    회사는 법령이 허용하는 범위에서 서비스 이용과 관련된 손해에
                    대해 책임을 제한할 수 있습니다.
                  </p>

                  <h3 className={styles.articleTitle}>
                    제16조(준거법 및 관할)
                  </h3>
                  <p>
                    본 약관은 대한민국 법령을 준거법으로 하며, 분쟁은
                    민사소송법상 관할 법원을 따릅니다.
                  </p>
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
                  <h3 className={styles.articleTitle}>1. 총칙</h3>
                  <p>
                    마인드 렌즈(이하 “회사”)은 「개인정보 보호법」 등 관련
                    법령을 준수하며 이용자의 개인정보 보호를 위해 본 방침을
                    수립합니다.
                  </p>

                  <h3 className={styles.articleTitle}>2. 개인정보 처리 목적</h3>
                  <ul className={styles.list}>
                    <li>회원가입 및 계정 관리</li>
                    <li>서비스 제공 및 운영(콘텐츠 저장 및 동기화)</li>
                    <li>고객 문의 대응</li>
                    <li>보안 및 서비스 안정화</li>
                    <li>(결제 기능 도입 시) 결제 및 정산 처리</li>
                  </ul>

                  <h3 className={styles.articleTitle}>
                    3. 처리하는 개인정보 항목
                  </h3>
                  <p className={styles.muted}>3.1 이메일 회원가입</p>
                  <ul className={styles.list}>
                    <li>필수: 이름, 이메일, 비밀번호(암호화 저장)</li>
                    <li>
                      자동수집: 접속 로그, 이용기록, IP, 기기/브라우저 정보
                    </li>
                  </ul>
                  <p className={styles.muted}>3.2 소셜 로그인(Google)</p>
                  <ul className={styles.list}>
                    <li>필수: 이름, 이메일(제공 범위 내)</li>
                    <li>
                      자동수집: 접속 로그, 이용기록, IP, 기기/브라우저 정보
                    </li>
                  </ul>
                  <p className={styles.muted}>3.3 비회원</p>
                  <ul className={styles.list}>
                    <li>계정 정보 미수집</li>
                    <li>
                      AI 기능 사용 시 입력 텍스트가 AI 처리 제공업체로 전송될 수
                      있음
                    </li>
                    <li>
                      서비스 안정화 및 보안 목적의 최소한의 서버 접속 로그가
                      생성될 수 있음
                    </li>
                  </ul>

                  <h3 className={styles.articleTitle}>4. 콘텐츠 저장 방식</h3>
                  <ul className={styles.list}>
                    <li>비회원: 기기 내 로컬 저장</li>
                    <li>회원: 회사 DB 저장</li>
                    <li>
                      회사는 접근통제, 암호화, 최소권한 등 보호조치를
                      적용합니다.
                    </li>
                  </ul>

                  <h3 className={styles.articleTitle}>5. 보유 및 이용 기간</h3>
                  <ul className={styles.list}>
                    <li>회원정보: 회원 탈퇴 시까지</li>
                    <li>접속 및 이용기록: 최대 1년</li>
                    <li>문의/분쟁 기록: 3년</li>
                    <li>
                      (결제 도입 시) 결제·정산 정보: 관련 법령에 따른 기간
                    </li>
                  </ul>

                  <h3 className={styles.articleTitle}>
                    6. 개인정보 제3자 제공
                  </h3>
                  <p>
                    회사는 원칙적으로 개인정보를 제3자에게 제공하지 않습니다.
                    다만 법령에 따른 경우 제공될 수 있습니다.
                  </p>

                  <h3 className={styles.articleTitle}>
                    7. 처리위탁 및 국외 이전
                  </h3>
                  <p className={styles.muted}>7.1 소셜 로그인</p>
                  <ul className={styles.list}>
                    <li>수탁자: Google LLC</li>
                    <li>목적: 로그인 인증</li>
                  </ul>
                  <p className={styles.muted}>7.2 AI 기능(OpenAI 등)</p>
                  <ul className={styles.list}>
                    <li>
                      수탁자: AI 처리 제공업체(OpenAI 등) 및 그 하위 처리업체
                    </li>
                    <li>이전 항목: AI 기능 실행 시 입력한 텍스트</li>
                    <li>이전 목적: AI 응답 생성</li>
                    <li>이전 국가: 국외</li>
                  </ul>
                  <p>
                    서버 운영 과정에서 보안 및 장애 대응을 위해 일부 요청 정보가
                    로그로 저장될 수 있으며, 회사는 민감 정보 최소화를 위한
                    보호조치를 적용합니다.
                  </p>

                  <h3 className={styles.articleTitle}>8. 이용자 권리</h3>
                  <p>
                    이용자는 개인정보 열람, 정정, 삭제, 처리정지, 동의 철회를
                    요청할 수 있습니다.
                  </p>

                  <h3 className={styles.articleTitle}>9. 파기 방법</h3>
                  <ul className={styles.list}>
                    <li>전자파일: 복구 불가 방식 삭제</li>
                    <li>종이문서: 분쇄 또는 소각</li>
                  </ul>

                  <h3 className={styles.articleTitle}>
                    10. 개인정보 보호책임자
                  </h3>
                  <ul className={styles.list}>
                    <li>담당: 개인정보 보호 담당</li>
                    <li>이메일: zin354@gmail.com</li>
                    <li>문의: zin354@gmail.com</li>
                  </ul>
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
                  <h3 className={styles.articleTitle}>
                    [필수] 개인정보 수집·이용 동의
                  </h3>
                  <ul className={styles.list}>
                    <li>수집 항목: 이름, 이메일, 비밀번호(이메일 가입 시)</li>
                    <li>
                      이용 목적: 회원가입, 계정 관리, 서비스 제공, 고객지원
                    </li>
                    <li>보유 기간: 회원 탈퇴 시까지</li>
                    <li>
                      거부 권리: 동의 거부 시 회원가입 및 회원 서비스 이용 제한
                    </li>
                  </ul>

                  <h3 className={styles.articleTitle}>
                    [필수] AI 기능 이용 및 국외 이전 고지
                  </h3>
                  <ul className={styles.list}>
                    <li>
                      AI 기능 제공을 위해 입력한 텍스트가 국외 AI 처리
                      제공업체(OpenAI 등)로 전송·처리될 수 있음
                    </li>
                    <li>목적: 질문 생성, 요약, 자기성찰을 위한 피드백 제공</li>
                    <li>동의 거부 시 서비스 이용이 제한될 수 있음</li>
                  </ul>

                  <h3 className={styles.articleTitle}>
                    [선택] 마케팅 정보 수신 동의
                  </h3>
                  <ul className={styles.list}>
                    <li>항목: 이메일</li>
                    <li>목적: 공지 및 이벤트 안내</li>
                    <li>보유 기간: 동의 철회 또는 탈퇴 시까지</li>
                  </ul>
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
