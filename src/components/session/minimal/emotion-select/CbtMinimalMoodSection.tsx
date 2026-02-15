import { CbtStepHeaderSection } from "@/components/session/common/CbtStepHeaderSection";
import {
  CbtSessionMoodToggle,
  type SessionMoodType,
} from "./CbtSessionMoodToggle";
import styles from "../MinimalStyles.module.css";

interface CbtMinimalMoodSectionProps {
  value: SessionMoodType | null;
  onChange: (next: SessionMoodType) => void;
}

export function CbtMinimalMoodSection({
  value,
  onChange,
}: CbtMinimalMoodSectionProps) {
  return (
    <div className={styles.section}>
      <div className={styles.sectionInner}>
        <CbtStepHeaderSection title="지금 어떤 기분인가요?" center />
        <div className={styles.moodBlock}>
          <CbtSessionMoodToggle value={value} onChange={onChange} />
        </div>
      </div>
    </div>
  );
}
