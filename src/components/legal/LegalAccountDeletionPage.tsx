import AppHeader from "@/components/header/AppHeader";
import LegalAccountDeletionContent from "@/components/legal/LegalAccountDeletionContent";
import styles from "@/app/legal/LegalPage.module.css";

export default function LegalAccountDeletionPage() {
  return (
    <div className={styles.page}>
      <AppHeader />
      <main className={styles.main}>
        <div className={styles.shell}>
          <section className={styles.card}>
            <h1 className={styles.title}>계정 삭제 요청</h1>
            <p className={styles.subtitle}>
              계정 및 관련 데이터 삭제 방법을 안내합니다.
            </p>
            <LegalAccountDeletionContent />
          </section>
        </div>
      </main>
    </div>
  );
}
