import CbtCarouselModal from "@/components/session/common/CbtCarouselModal";
import { CbtStepHeaderSection } from "@/components/session/common/CbtStepHeaderSection";
import { useCbtToast } from "@/components/session/common/CbtToast";
import { useCbtAutoResizeTextarea } from "@/components/session/hooks/useCbtAutoResizeTextarea";
import { CbtInlineNextButton } from "@/components/session/minimal/common/CbtInlineNextButton";
import styles from "@/components/session/minimal/MinimalStyles.module.css";
import { validateUserText } from "@/components/session/utils/validation";
import SafeButton from "@/components/ui/SafeButton";
import type { EmotionNote } from "@/lib/types/emotionNoteTypes";
import { History } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import deepStyles from "../DeepStyles.module.css";

interface CbtDeepIncidentSectionProps {
  userInput: string;
  onInputChange: (value: string) => void;
  onNext: () => void;
  mainNote: EmotionNote;
  subNotes: EmotionNote[];
}

export function CbtDeepIncidentSection({
  userInput,
  onInputChange,
  onNext,
  mainNote,
  subNotes,
}: CbtDeepIncidentSectionProps) {
  const { pushToast } = useCbtToast();
  const title = (
    <>
      다시, 이 일에 대해
      <span className={deepStyles.titleBreak} aria-hidden="true" />
      생각해봅니다.
    </>
  );

  const headerRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  useCbtAutoResizeTextarea(textareaRef, [userInput]);
  const [isPreviousOpen, setIsPreviousOpen] = useState(false);
  const [highlightInput, setHighlightInput] = useState(false);

  const handleUsePrevious = () => {
    setIsPreviousOpen(true);
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

  const buildNoteLines = (note: EmotionNote) => {
    const thought = note.thought_details?.[0]?.automatic_thought;
    const errorDetail = note.error_details?.[0];
    const errorText =
      errorDetail?.error_description || errorDetail?.error_label || "";
    return [note.trigger_text, thought, errorText].filter(
      (value): value is string => Boolean(value?.trim()),
    );
  };
  const noteLines = buildNoteLines(mainNote);
  const description = (
    <div className={deepStyles.triggerList}>
      <div
        className={`${deepStyles.triggerItem} ${deepStyles.triggerItemMain}`}
      >
        {noteLines.map((line, index) => {
          const opacity = Math.max(0.45, 1 - index * 0.2);
          const fontScale = Math.max(0.8, 1 - index * 0.1);
          return (
            <p
              key={`${mainNote.id}-main-${index}`}
              className={deepStyles.triggerText}
              style={{
                opacity,
                fontSize: `${fontScale}em`,
              }}
            >
              {line}
            </p>
          );
        })}
      </div>
    </div>
  );

  useEffect(() => {
    const node = headerRef.current;
    if (!node || typeof window === "undefined") return;
    const rect = node.getBoundingClientRect();
    const target =
      window.scrollY + rect.top - (window.innerHeight / 2 - rect.height / 2);
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

  const previousItems = useMemo(() => {
    const allNotes = [mainNote, ...subNotes].filter(Boolean);
    return allNotes
      .map((note, index) => {
        const trigger = note.trigger_text?.trim() ?? "";
        if (!trigger) return null;
        const thought = note.thought_details?.[0]?.automatic_thought?.trim();
        const errorDetail = note.error_details?.[0];
        const errorText =
          errorDetail?.error_description?.trim() ||
          errorDetail?.error_label?.trim() ||
          "";
        const lines = [
          { label: "상황", text: trigger },
          thought ? { label: "자동사고", text: thought } : null,
          errorText ? { label: "인지오류", text: errorText } : null,
        ].filter((line): line is { label: string; text: string } =>
          Boolean(line),
        );
        return {
          id: `note-${note.id ?? index}`,
          title: index === 0 ? "최근 기록" : `이전 기록 ${index}`,
          body: trigger,
          applyText: trigger,
          lines,
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));
  }, [mainNote, subNotes]);

  return (
    <div className={styles.section}>
      <div className={styles.sectionInner}>
        <div className={styles.headerInset} ref={headerRef}>
          <CbtStepHeaderSection title={title} description={description} />
        </div>

        <div className={styles.formStack}>
          <div
            className={`${styles.inputWrap} ${styles.incidentInputCard} ${
              userInput.trim()
                ? styles.inputWrapFilled
                : "감정 일기를 기록하는 곳입니다."
            } ${highlightInput ? styles.inputWrapHighlight : ""} ${
              styles.inputWrapWithFab
            }`}
          >
            <div
              className={`${styles.textareaShell} ${styles.textareaShellWithFab}`}
            >
              <textarea
                ref={textareaRef}
                value={userInput}
                onChange={(event) => onInputChange(event.target.value)}
                placeholder="구체적으로 쓰면 더욱 효과적입니다."
                rows={1}
                data-tour="deep-incident-input"
                className={`${styles.textarea} ${styles.incidentTextarea} ${styles.textareaWithFab}`}
              />
              <div className={styles.textareaActionRow}>
                <SafeButton
                  type="button"
                  variant="unstyled"
                  onClick={handleUsePrevious}
                  className={`${styles.exampleButton} ${styles.textareaActionButton}`}
                >
                  <History className={styles.textareaActionIcon} />
                  이전 기록
                </SafeButton>
              </div>
              <CbtInlineNextButton onClick={handleNext} ariaLabel="다음으로" />
            </div>
          </div>
        </div>
      </div>

      <CbtCarouselModal
        open={isPreviousOpen}
        title="이전의 상황을 살펴볼까요?"
        notice="선택하면 입력창에 자동으로 입력됩니다."
        items={previousItems}
        onClose={() => setIsPreviousOpen(false)}
        onSelect={(value) => {
          onInputChange(value);
          setIsPreviousOpen(false);
          pushToast("입력창에 복사했어요.", "success");
          setHighlightInput(true);
          requestAnimationFrame(() => {
            textareaRef.current?.focus();
            const len = textareaRef.current?.value.length ?? 0;
            textareaRef.current?.setSelectionRange(len, len);
          });
        }}
        emptyMessage="이전 기록을 찾지 못했습니다."
        selectOnSlide
        showSelectButton={false}
        plainSlides
      />
    </div>
  );
}
