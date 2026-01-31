import styles from "@/app/legal/LegalPage.module.css";

export default function LegalPrivacyPolicyContent() {
  return (
    <>
      <h3 className={styles.articleTitle}>1. 총칙</h3>
      <p>
        에디(EDi)와의 감정일기: AI제안 · AI분석(이하 “회사”)은 「개인정보
        보호법」 등 관련 법령을 준수하며 이용자의 개인정보 보호를 위해 본 방침을
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

      <h3 className={styles.articleTitle}>3. 처리하는 개인정보 항목</h3>
      <p className={styles.muted}>3.1 이메일 회원가입</p>
      <ul className={styles.list}>
        <li>필수: 이름, 이메일, 비밀번호(암호화 저장)</li>
        <li>자동수집: 접속 로그, 이용기록, IP, 기기/브라우저 정보</li>
      </ul>
      <p className={styles.muted}>3.2 소셜 로그인(Google)</p>
      <ul className={styles.list}>
        <li>필수: 이름, 이메일(제공 범위 내)</li>
        <li>자동수집: 접속 로그, 이용기록, IP, 기기/브라우저 정보</li>
      </ul>
      <p className={styles.muted}>3.3 비회원</p>
      <ul className={styles.list}>
        <li>계정 정보 미수집</li>
        <li>AI 기능 사용 시 입력 텍스트가 AI 처리 제공업체로 전송될 수 있음</li>
        <li>
          서비스 안정화 및 보안 목적의 최소한의 서버 접속 로그가 생성될 수 있음
        </li>
      </ul>

      <h3 className={styles.articleTitle}>4. 콘텐츠 저장 방식</h3>
      <ul className={styles.list}>
        <li>비회원: 기기 내 로컬 저장</li>
        <li>회원: 회사 DB 저장</li>
        <li>회사는 접근통제, 암호화, 최소권한 등 보호조치를 적용합니다.</li>
      </ul>

      <h3 className={styles.articleTitle}>5. 보유 및 이용 기간</h3>
      <ul className={styles.list}>
        <li>회원정보: 회원 탈퇴 시까지</li>
        <li>접속 및 이용기록: 최대 1년</li>
        <li>문의/분쟁 기록: 3년</li>
        <li>(결제 도입 시) 결제·정산 정보: 관련 법령에 따른 기간</li>
      </ul>

      <h3 className={styles.articleTitle}>6. 개인정보 제3자 제공</h3>
      <p>
        회사는 원칙적으로 개인정보를 제3자에게 제공하지 않습니다. 다만 법령에
        따른 경우 제공될 수 있습니다.
      </p>

      <h3 className={styles.articleTitle}>7. 처리위탁 및 국외 이전</h3>
      <p className={styles.muted}>7.1 소셜 로그인</p>
      <ul className={styles.list}>
        <li>수탁자: Google LLC</li>
        <li>목적: 로그인 인증</li>
      </ul>
      <p className={styles.muted}>7.2 AI 기능(OpenAI 등)</p>
      <ul className={styles.list}>
        <li>수탁자: AI 처리 제공업체(OpenAI 등) 및 그 하위 처리업체</li>
        <li>이전 항목: AI 기능 실행 시 입력한 텍스트</li>
        <li>이전 목적: AI 응답 생성</li>
        <li>이전 국가: 국외</li>
      </ul>
      <p>
        서버 운영 과정에서 보안 및 장애 대응을 위해 일부 요청 정보가 로그로
        저장될 수 있으며, 회사는 민감 정보 최소화를 위한 보호조치를 적용합니다.
      </p>

      <h3 className={styles.articleTitle}>8. 이용자 권리</h3>
      <p>
        이용자는 개인정보 열람, 정정, 삭제, 처리정지, 동의 철회를 요청할 수
        있습니다.
      </p>

      <h3 className={styles.articleTitle}>9. 파기 방법</h3>
      <ul className={styles.list}>
        <li>전자파일: 복구 불가 방식 삭제</li>
        <li>종이문서: 분쇄 또는 소각</li>
      </ul>

      <h3 className={styles.articleTitle}>10. 개인정보 보호책임자</h3>
      <ul className={styles.list}>
        <li>담당: 개인정보 보호 담당</li>
        <li>이메일: zin354@gmail.com</li>
        <li>문의: zin354@gmail.com</li>
      </ul>
    </>
  );
}
