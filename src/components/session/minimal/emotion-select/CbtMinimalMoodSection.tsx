import { CbtStepHeaderSection } from "@/components/session/common/CbtStepHeaderSection";
import {
  CbtSessionMoodToggle,
  type SessionMoodType,
} from "./CbtSessionMoodToggle";
import styles from "../MinimalStyles.module.css";

interface CbtMinimalMoodSectionProps {
  value: SessionMoodType | null;
  onChange: (next: SessionMoodType) => void;
  title?: string;
}

export function CbtMinimalMoodSection({
  value,
  onChange,
  title = "지금 어떤 기분인가요?",
}: CbtMinimalMoodSectionProps) {
  const renderedTitle = (() => {
    const match = title.match(/^(.+에)\s어떤 기분이었나요\?$/);
    if (!match) {
      return title;
    }
    return (
      <>
        {match[1]}
        <span className={styles.mobileLineBreak} />
        어떤 기분이었나요?
      </>
    );
  })();

  return (
    <div className={styles.section}>
      <div className={styles.sectionInner}>
        <CbtStepHeaderSection title={renderedTitle} center />
        <div className={styles.moodBlock}>
          <CbtSessionMoodToggle value={value} onChange={onChange} />
        </div>
      </div>
    </div>
  );
}
