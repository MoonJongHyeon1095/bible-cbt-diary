import styles from "@/components/cbt/minimal/MinimalStyles.module.css";
import { useModalOpen } from "@/components/common/useModalOpen";
import CharacterPrompt from "@/components/ui/CharacterPrompt";

type CbtSavingModalProps = {
  open: boolean;
};

export function CbtSavingModal({ open }: CbtSavingModalProps) {
  useModalOpen(open);

  if (!open) return null;

  return (
    <div className={styles.savingOverlay}>
      <div className={styles.savingCard}>
        <div className={styles.savingSpinner} />
        <CharacterPrompt
          name="EDi"
          greeting={
            <>
              살펴본 마음의 풍경은{" "}
              <br className={styles.mobileLineBreak} />
              어떠셨을까요?
            </>
          }
          className={styles.savingTitle}
        />
        <p className={styles.savingSubtitle}>
          함께 만든 기록을 저장하는 중입니다.
        </p>
      </div>
    </div>
  );
}
