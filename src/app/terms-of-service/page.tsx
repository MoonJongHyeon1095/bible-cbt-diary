import AppHeader from "@/components/header/AppHeader";
import TermsOfServiceContent from "@/components/legal/TermsOfServiceContent";
import styles from "../legal/LegalPage.module.css";

export default function TermsOfServicePage() {
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
            <TermsOfServiceContent />
          </section>
        </div>
      </main>
    </div>
  );
}
