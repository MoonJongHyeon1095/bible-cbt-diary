import AppHeader from "@/components/header/AppHeader";
import styles from "@/components/legal/LegalPage.module.css";
import LegalTermsOfServiceContent from "@/components/legal/LegalTermsOfServiceContent";

export default function LegalTermsOfServicePage() {
  return (
    <div className={styles.page}>
      <AppHeader />
      <main className={styles.main}>
        <div className={styles.shell}>
          <section className={styles.card}>
            <h1 className={styles.title}>이용약관</h1>
            <p className={styles.subtitle}>
              Flow : AI 일기 · 감정 그래프 서비스 이용을 위한 약관입니다.
            </p>
            <LegalTermsOfServiceContent />
          </section>
        </div>
      </main>
    </div>
  );
}
