import { useModalOpen } from "@/components/common/useModalOpen";
import styles from "../MinimalStyles.module.css";

type CbtMinimalSavingModalProps = {
  open: boolean;
};

export function CbtMinimalSavingModal({ open }: CbtMinimalSavingModalProps) {
  useModalOpen(open);

  if (!open) return null;

  return (
    <div className={styles.savingOverlay}>
      <div className={styles.savingCard}>
        <div className={styles.savingSpinner} />
        <p className={styles.savingTitle}>
          세션이 만족스러우셨을지 모르겠습니다.
        </p>
        <p className={styles.savingSubtitle}>
          다만 우리는 진심으로, 당신의 평안을 바랍니다.
        </p>
      </div>
    </div>
  );
}
