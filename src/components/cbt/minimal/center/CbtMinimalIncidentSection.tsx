import { validateUserText } from "@/components/cbt/utils/validation";
import { ALL_EXAMPLES } from "@/lib/constants/examples";
import { useCbtToast } from "@/components/cbt/common/CbtToast";
import { CbtMinimalFloatingNextButton } from "../common/CbtMinimalFloatingNextButton";
import { CbtMinimalStepHeaderSection } from "../common/CbtMinimalStepHeaderSection";
import { CbtMinimalIncidentForm } from "./components/CbtMinimalIncidentForm";
import styles from "../MinimalStyles.module.css";

interface CbtMinimalIncidentSectionProps {
  userInput: string;
  onInputChange: (value: string) => void;
  onNext: () => void;
  title?: string;
}

export function CbtMinimalIncidentSection({
  userInput,
  onInputChange,
  onNext,
  title = "오늘 무슨 일이 있었나요?",
}: CbtMinimalIncidentSectionProps) {
  const { pushToast } = useCbtToast();
  const description =
    "힘들었던 경험이나 불편했던 상황을 자유롭게 적어주세요.";

  const handleShowExample = () => {
    if (!ALL_EXAMPLES.length) return;
    const index = Math.floor(Math.random() * ALL_EXAMPLES.length);
    const example = ALL_EXAMPLES[index]?.text;
    if (example) onInputChange(example);
  };

  const handleNext = () => {
    const validation = validateUserText(userInput, {
      minLength: 10,
      minLengthMessage: "상황을 10자 이상 입력해주세요.",
    });
    if (!validation.ok) {
      pushToast(validation.message, "error");
      return;
    }
    onNext();
  };

  return (
    <div className={styles.section}>
      <div className={styles.sectionInner}>
        <div className={styles.headerInset}>
          <CbtMinimalStepHeaderSection title={title} description={description} />
        </div>

        <CbtMinimalIncidentForm
          userInput={userInput}
          onInputChange={onInputChange}
          onShowExample={handleShowExample}
        />

        <CbtMinimalFloatingNextButton onClick={handleNext} />
      </div>
    </div>
  );
}
