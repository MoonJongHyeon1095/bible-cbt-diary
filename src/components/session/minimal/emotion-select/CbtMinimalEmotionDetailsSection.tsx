import type { EmotionOption } from "@/lib/constants/emotions";
import { CbtMinimalFloatingNextButton } from "../common/CbtMinimalFloatingNextButton";
import styles from "../MinimalStyles.module.css";

interface CbtMinimalEmotionDetailsSectionProps {
  emotion?: EmotionOption;
  isVisible: boolean;
  onNext: () => void;
}

export function CbtMinimalEmotionDetailsSection({
  emotion,
  isVisible,
  onNext,
}: CbtMinimalEmotionDetailsSectionProps) {
  return (
    <div
      style={{
        maxHeight: isVisible ? "900px" : "0px",
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(-6px)",
        overflow: "hidden",
        transition: "all 0.3s ease",
      }}
    >
      {emotion && (
        <div className={styles.emotionDetails}>
          <div>
            <p className={styles.detailTitle}>{emotion.description}</p>
            <p className={styles.detailSubtext}>{emotion.physical}</p>
          </div>

          <div className={styles.detailList}>
            <p className={styles.detailTitle} style={{ fontSize: "1rem" }}>
              이 감정의 긍정적인 면
            </p>
            {emotion.positive.map((item, idx) => (
              <div key={idx} className={styles.detailListItem}>
                <span className={styles.detailBullet}>•</span>
                <span>{item}</span>
              </div>
            ))}
          </div>

          {emotion.caution.length > 0 && (
            <div className={styles.detailList}>
              <p className={styles.detailTitle} style={{ fontSize: "1rem" }}>
                주의할 점
              </p>
              {emotion.caution.map((item, idx) => (
                <div key={idx} className={styles.detailListItem}>
                  <span className={styles.detailBullet}>•</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          )}

          <CbtMinimalFloatingNextButton
            onClick={onNext}
          />
        </div>
      )}
    </div>
  );
}
