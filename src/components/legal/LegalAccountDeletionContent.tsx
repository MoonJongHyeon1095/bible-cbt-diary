import styles from "@/components/legal/LegalPage.module.css";

export default function LegalAccountDeletionContent() {
  return (
    <>
      <h3 className={styles.articleTitle}>계정 삭제 요청 안내</h3>
      <p>
        에디(EDi)와의 감정일기: AI제안 · AI분석(이하 “앱”)의 계정 및 관련 데이터
        삭제를 원하실 경우 아래 절차로 요청하실 수 있습니다.
      </p>

      <h3 className={styles.articleTitle}>요청 방법</h3>
      <ul className={styles.list}>
        <li>이메일: zin354@gmail.com</li>
        <li>제목: 계정 삭제 요청</li>
        <li>본문: 로그인에 사용한 이메일 주소를 포함해 주세요.</li>
      </ul>

      <h3 className={styles.articleTitle}>삭제되는 데이터</h3>
      <ul className={styles.list}>
        <li>계정 식별 정보(이메일 등)</li>
        <li>감정 기록 및 관련 AI 분석 결과</li>
      </ul>

      <h3 className={styles.articleTitle}>보관될 수 있는 데이터</h3>
      <ul className={styles.list}>
        <li>보안 및 악용 방지를 위한 최소한의 서버 로그</li>
      </ul>

      <h3 className={styles.articleTitle}>처리 기간</h3>
      <p>
        삭제 요청을 접수한 날로부터 30일 이내에 계정 및 기록 데이터를
        삭제합니다. 보안 로그는 최대 7일 보관 후 자동 삭제될 수 있습니다.
      </p>

      <h3 className={styles.articleTitle}>개발자 정보</h3>
      <ul className={styles.list}>
        <li>개발자/운영: 에디(EDi)와의 감정일기: AI제안 · AI분석</li>
        <li>연락처: zin354@gmail.com</li>
      </ul>
    </>
  );
}
