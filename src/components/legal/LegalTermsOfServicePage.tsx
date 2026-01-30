import AppHeader from "@/components/header/AppHeader";
import LegalTermsOfServiceContent from "@/components/legal/LegalTermsOfServiceContent";
import styles from "@/app/legal/LegalPage.module.css";

export default function LegalTermsOfServicePage() {
  return (
    <div className={styles.page}>
      <AppHeader />
      <main className={styles.main}>
        <div className={styles.shell}>
          <section className={styles.card}>
            <h1 className={styles.title}>이용약관</h1>
            <p className={styles.subtitle}>
              마인드 렌즈 서비스 이용을 위한 약관입니다.
            </p>
            <LegalTermsOfServiceContent />
          </section>
        </div>
      </main>
    </div>
  );
}
