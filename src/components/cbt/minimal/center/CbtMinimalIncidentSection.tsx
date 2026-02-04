import { validateUserText } from "@/components/cbt/utils/validation";
import { ALL_EXAMPLES } from "@/lib/constants/examples";
import { useCbtToast } from "@/components/cbt/common/CbtToast";
import { CbtInlineNextButton } from "../common/CbtInlineNextButton";
import { CbtMinimalStepHeaderSection } from "../common/CbtMinimalStepHeaderSection";
import { CbtMinimalIncidentForm } from "./components/CbtMinimalIncidentForm";
import styles from "../MinimalStyles.module.css";
import { useEffect, useMemo, useRef, useState } from "react";
import CbtCarouselModal from "@/components/cbt/common/CbtCarouselModal";
import { Sparkles } from "lucide-react";

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
  const headerRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [isExampleOpen, setIsExampleOpen] = useState(false);
  const [highlightInput, setHighlightInput] = useState(false);

  const handleShowExample = () => {
    if (!ALL_EXAMPLES.length) return;
    setIsExampleOpen(true);
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

  useEffect(() => {
    const node = headerRef.current;
    if (!node || typeof window === "undefined") return;
    const rect = node.getBoundingClientRect();
    const target = window.scrollY + rect.top - (window.innerHeight / 2 - rect.height / 2);
    const top = Math.max(0, target);
    window.scrollTo({ top, behavior: "auto" });
  }, []);

  useEffect(() => {
    if (!highlightInput) return;
    const timer = window.setTimeout(() => {
      setHighlightInput(false);
    }, 1400);
    return () => window.clearTimeout(timer);
  }, [highlightInput]);

  const exampleItems = useMemo(
    () =>
      ALL_EXAMPLES.map((example, index) => ({
        id: `example-${index}`,
        title: `예시 ${index + 1}`,
        body: example.text,
        applyText: example.text,
      })),
    [],
  );

  return (
    <div className={styles.section}>
      <div className={styles.sectionInner}>
        <div className={styles.headerInset} ref={headerRef}>
          <CbtMinimalStepHeaderSection title={title} description={description} />
        </div>

        <CbtMinimalIncidentForm
          userInput={userInput}
          onInputChange={onInputChange}
          highlightInput={highlightInput}
          textareaRef={textareaRef}
          actionRow={
            <SafeButton
              type="button"
              variant="unstyled"
              onClick={handleShowExample}
              data-tour="minimal-incident-example"
              className={`${styles.exampleButton} ${styles.textareaActionButton}`}
            >
              <Sparkles className={styles.textareaActionIcon} />
              예시 보기
            </SafeButton>
          }
          action={
            <CbtInlineNextButton
              onClick={handleNext}
              ariaLabel="다음으로"
              dataTour="minimal-incident-next"
            />
          }
        />
      </div>

      <CbtCarouselModal
        open={isExampleOpen}
        title="예시를 골라서 시작해볼까요?"
        notice="선택하면 입력창에 자동으로 채워집니다."
        items={exampleItems}
        onClose={() => setIsExampleOpen(false)}
        onSelect={(value) => {
          onInputChange(value);
          setIsExampleOpen(false);
          pushToast("입력창에 복사했어요.", "success");
          setHighlightInput(true);
          requestAnimationFrame(() => {
            textareaRef.current?.focus();
            const len = textareaRef.current?.value.length ?? 0;
            textareaRef.current?.setSelectionRange(len, len);
          });
        }}
        emptyMessage="현재 보여줄 예시가 없습니다."
        selectOnSlide
        showSelectButton={false}
        plainSlides
      />
    </div>
  );
}
