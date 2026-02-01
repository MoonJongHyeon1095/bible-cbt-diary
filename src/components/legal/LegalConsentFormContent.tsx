import styles from "@/components/legal/LegalPage.module.css";

export default function LegalConsentFormContent() {
  return (
    <>
      <h3 className={styles.articleTitle}>[필수] 개인정보 수집·이용 동의</h3>
      <ul className={styles.list}>
        <li>수집 항목: 이름, 이메일, 비밀번호(이메일 가입 시)</li>
        <li>이용 목적: 회원가입, 계정 관리, 서비스 제공, 고객지원</li>
        <li>보유 기간: 회원 탈퇴 시까지</li>
        <li>거부 권리: 동의 거부 시 회원가입 및 회원 서비스 이용 제한</li>
      </ul>

      <h3 className={styles.articleTitle}>
        [필수] AI 기능 이용 및 국외 이전 고지
      </h3>
      <ul className={styles.list}>
        <li>
          AI 기능 제공을 위해 입력한 텍스트가 국외 AI 처리 제공업체(OpenAI 등)로
          전송·처리될 수 있음
        </li>
        <li>목적: 질문 생성, 요약, 자기성찰을 위한 피드백 제공</li>
        <li>동의 거부 시 서비스 이용이 제한될 수 있음</li>
      </ul>
    </>
  );
}
