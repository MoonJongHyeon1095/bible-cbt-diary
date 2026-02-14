"use client";

import SafeButton from "@/components/ui/SafeButton";
import styles from "../../EntranceOverlay.module.css";

type EntranceFlowScene2Props = {
  lines: string[];
  skipLabel: string;
  continueLabel: string;
  onSkip: () => void;
  onContinue: () => void;
};

export default function EntranceFlowScene2({
  lines,
  skipLabel,
  continueLabel,
  onSkip,
  onContinue,
}: EntranceFlowScene2Props) {
  return (
    <div className={styles.scene2Wrap}>
      <div className={styles.scene2Content}>
        <div className={styles.scene2Body}>
          {lines.map((line, index) => (
            <p
              key={`scene2-line-${index}`}
              className={`${styles.scene2Line} ${
                line.startsWith("(") ? styles.scene2LineAside : ""
              }`.trim()}
              style={{ ["--line-i" as string]: index }}
            >
              {line}
            </p>
          ))}
        </div>
      </div>
      <div className={styles.scene2Actions}>
        <SafeButton
          type="button"
          mode="native"
          className={`${styles.scene2Button} ${styles.scene2ButtonSecondary}`}
          onClick={onSkip}
        >
          {skipLabel}
        </SafeButton>
        <SafeButton
          type="button"
          mode="native"
          className={`${styles.scene2Button} ${styles.scene2ButtonPrimary}`}
          onClick={onContinue}
        >
          {continueLabel}
        </SafeButton>
      </div>
    </div>
  );
}
