import AppHeader from "@/components/header/AppHeader";
import LegalPrivacyPolicyContent from "@/components/legal/LegalPrivacyPolicyContent";
import styles from "@/app/legal/LegalPage.module.css";

export default function LegalPrivacyPolicyPage() {
  return (
    <div className={styles.page}>
      <AppHeader />
      <main className={styles.main}>
        <div className={styles.shell}>
          <section className={styles.card}>
            <h1 className={styles.title}>개인정보 처리방침</h1>
            <p className={styles.subtitle}>
              이드(ED) 감정일기: AI제안 · AI분석는 이용자의 개인정보 보호를 위해 최선을 다합니다.
            </p>
            <LegalPrivacyPolicyContent />
          </section>
        </div>
      </main>
    </div>
  );
}
