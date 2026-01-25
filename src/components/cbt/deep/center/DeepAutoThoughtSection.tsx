import { useCbtToast } from "@/components/cbt/common/CbtToast";
import { MinimalAutoThoughtTextSection } from "@/components/cbt/minimal/center/components/MinimalAutoThoughtTextSection";
import { MinimalFloatingNextButton } from "@/components/cbt/minimal/common/MinimalFloatingNextButton";
import { MinimalLoadingState } from "@/components/cbt/minimal/common/MinimalLoadingState";
import { MinimalStepHeaderSection } from "@/components/cbt/minimal/common/MinimalStepHeaderSection";
import styles from "@/components/cbt/minimal/MinimalStyles.module.css";
import Button from "@/components/ui/Button";
import type { EmotionNote } from "@/lib/types/types";
import { useDeepAutoThought } from "../hooks/useDeepAutoThought";

interface DeepAutoThoughtSectionProps {
  userInput: string;
  emotion: string;
  mainNote: EmotionNote;
  subNotes: EmotionNote[];
  onComplete: (autoThought: string, summary: string) => void;
}

const TITLE = "어쩌면 지긋지긋한 생각들일지도 모릅니다.";

export function DeepAutoThoughtSection({
  userInput,
  emotion,
  mainNote,
  subNotes,
  onComplete,
}: DeepAutoThoughtSectionProps) {
  const { pushToast } = useCbtToast();
  const { autoThought, summary, loading, error, reload } = useDeepAutoThought({
    userInput,
    emotion,
    mainNote,
    subNotes,
  });

  const handleNext = () => {
    if (!autoThought.trim() || !summary.trim()) {
      pushToast("생각을 불러오는 중입니다.", "error");
      return;
    }
    onComplete(autoThought, summary);
  };

  if (loading) {
    return (
      <MinimalLoadingState
        title={TITLE}
        message="생각을 정리하고 있어요."
        variant="page"
      />
    );
  }

  if (error) {
    return (
      <div className={styles.section}>
        <div className={styles.sectionInner}>
          <div className={styles.headerInset}>
            <MinimalStepHeaderSection title={TITLE} />
          </div>
          <div className={styles.inlineCard}>
            <p className={styles.textBlock}>{error}</p>
            <Button
              type="button"
              variant="unstyled"
              onClick={() => void reload()}
              className={styles.exampleButton}
            >
              다시 불러오기
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.section}>
      <div className={styles.sectionInner}>
        <div className={styles.headerInset}>
          <MinimalStepHeaderSection title={TITLE} />
        </div>

        <div className={styles.inlineCard}>
          <MinimalAutoThoughtTextSection
            belief={autoThought}
            emotionReason=""
            fallback="생각을 불러오는 중입니다."
          />
        </div>

        <MinimalFloatingNextButton onClick={handleNext} />
      </div>
    </div>
  );
}
