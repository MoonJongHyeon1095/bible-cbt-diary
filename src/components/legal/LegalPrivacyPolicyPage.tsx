import styles from "@/components/legal/LegalPage.module.css";
import AppHeader from "@/components/header/AppHeader";
import LegalPrivacyPolicyContent from "@/components/legal/LegalPrivacyPolicyContent";

export default function LegalPrivacyPolicyPage() {
  return (
    <div className={styles.page}>
      <AppHeader />
      <main className={styles.main}>
        <div className={styles.shell}>
          <section className={styles.card}>
            <h1 className={styles.title}>개인정보 처리방침</h1>
            <p className={styles.subtitle}>
              에디(EDi)와의 감정일기: AI제안 · AI분석 서비스는 이용자의 개인정보
              보호를 위해 최선을 다합니다.
            </p>
            <LegalPrivacyPolicyContent />
          </section>
        </div>
      </main>
    </div>
  );
}
