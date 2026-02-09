import AppHeader from "@/components/header/AppHeader";
import styles from "@/components/legal/LegalPage.module.css";
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
              Flow : AI 일기 · 감정 그래프 서비스는 이용자의 개인정보 보호를
              위해 최선을 다합니다.
            </p>
            <div className={styles.legalBody}>
              <LegalPrivacyPolicyContent />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
