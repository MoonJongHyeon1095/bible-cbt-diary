"use client";

import { useCbtToast } from "@/components/cbt/common/CbtToast";
import Textarea from "@/components/ui/Textarea";
import { generateContextualAlternativeThoughts } from "@/lib/ai";
import { EmotionNoteDetail, EmotionNoteErrorDetail } from "@/lib/types/types";
import { checkAiUsageLimit } from "@/lib/utils/aiUsageGuard";
import { Lightbulb, Loader2, Save, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AiActionBar } from "./common/AiActionBar";
import { AiCandidatesPanel } from "./common/AiCandidatesPanel";
import { AiLoadingCard } from "./common/AiLoadingCard";
import { ExpandableText } from "./common/ExpandableText";
import { FloatingStepNav } from "./common/FloatingStepNav";
import { PatternAddSectionShell } from "./common/PatternAddSectionShell";
import { SelectionCard } from "./common/SelectionCard";
import { SelectionPanel } from "./common/SelectionPanel";
import styles from "./PatternAlternativesAddSection.module.css";

interface PatternAlternativesAddSectionProps {
  triggerText: string;
  details: EmotionNoteDetail[];
  errorDetails: EmotionNoteErrorDetail[];
  alternativeText: string;
  loading: boolean;
  onChangeAlternativeText: (value: string) => void;
  onAddAlternative: () => void;
  onClose?: () => void;
}

export function PatternAlternativesAddSection({
  triggerText,
  details,
  errorDetails,
  alternativeText,
  loading,
  onChangeAlternativeText,
  onAddAlternative,
  onClose,
}: PatternAlternativesAddSectionProps) {
  const { pushToast } = useCbtToast();
  const [aiLoading, setAiLoading] = useState(false);
  const [aiStep, setAiStep] = useState<
    "idle" | "select-thought" | "select-errors" | "loading" | "suggestions"
  >("idle");
  const [aiCandidates, setAiCandidates] = useState<
    Array<{
      thought: string;
      technique: string;
      techniqueDescription: string;
    }>
  >([]);
  const [aiError, setAiError] = useState<string | null>(null);
  const [selectedDetailId, setSelectedDetailId] = useState("");
  const [selectedErrorIds, setSelectedErrorIds] = useState<string[]>([]);
  const [expandedDetailIds, setExpandedDetailIds] = useState<string[]>([]);
  const [expandedErrorIds, setExpandedErrorIds] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const hasCandidates = aiCandidates.length > 0;
  const aiButtonLabel = hasCandidates ? "다시 제안" : "AI 제안";

  useEffect(() => {
    if (
      selectedDetailId &&
      !details.some((detail) => String(detail.id) === selectedDetailId)
    ) {
      setSelectedDetailId("");
    }
  }, [details, selectedDetailId]);

  useEffect(() => {
    if (selectedErrorIds.length > 0) {
      setSelectedErrorIds((prev) =>
        prev.filter((id) =>
          errorDetails.some((error) => String(error.id) === id),
        ),
      );
    }
  }, [errorDetails, selectedErrorIds.length]);

  useEffect(() => {
    setAiCandidates([]);
    setAiError(null);
  }, [triggerText, selectedDetailId]);

  const formatErrorLabel = (error: EmotionNoteErrorDetail) => {
    const label = error.error_label?.trim() || "인지오류";
    return label.length > 24 ? `${label.slice(0, 24)}…` : label;
  };

  const startAiSelection = () => {
    setSelectedDetailId("");
    setSelectedErrorIds([]);
    setAiCandidates([]);
    setAiError(null);
    setAiStep("select-thought");
    onChangeAlternativeText("");
  };

  const handleAiAction = async () => {
    const allowed = await checkAiUsageLimit(pushToast);
    if (!allowed) return;
    startAiSelection();
  };

  const handleClose = async () => {
    onClose?.();
  };

  const handleSelectDetail = (detailId: string) => {
    setSelectedDetailId(detailId);
    setSelectedErrorIds([]);
  };

  const toggleDetailExpanded = (detailId: string) => {
    setExpandedDetailIds((prev) =>
      prev.includes(detailId)
        ? prev.filter((id) => id !== detailId)
        : [...prev, detailId],
    );
  };

  const toggleErrorExpanded = (errorId: string) => {
    setExpandedErrorIds((prev) =>
      prev.includes(errorId)
        ? prev.filter((id) => id !== errorId)
        : [...prev, errorId],
    );
  };

  const handleToggleError = (errorId: string) => {
    setSelectedErrorIds((prev) => {
      if (prev.includes(errorId)) {
        return prev.filter((id) => id !== errorId);
      }
      if (prev.length >= 2) {
        return prev;
      }
      return [...prev, errorId];
    });
  };

  const handleGenerateCandidates = async (
    detailId: string,
    errorIds: string[],
  ) => {
    const detail = details.find((item) => String(item.id) === detailId) ?? null;
    if (!detail) return;
    const errors = errorDetails.filter((error) =>
      errorIds.includes(String(error.id)),
    );
    if (errors.length === 0) return;

    setAiLoading(true);
    setAiError(null);
    setAiStep("loading");
    try {
      const result = await generateContextualAlternativeThoughts(
        triggerText,
        detail.emotion,
        detail.automatic_thought,
        errors.map((error) => ({
          title: error.error_label,
          detail: error.error_description,
        })),
        { noteProposal: true },
      );
      setAiCandidates(result);
      setAiStep("suggestions");
    } catch (error) {
      console.error(error);
      setAiError("AI 제안을 불러오지 못했습니다.");
      setAiStep("select-errors");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSelectCandidate = (thought: string) => {
    onChangeAlternativeText(thought);
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
    });
  };

  const manualMode = aiStep === "idle";
  const showFloatingNext =
    aiStep === "select-thought" || aiStep === "select-errors";
  const nextDisabled =
    (aiStep === "select-thought" && !selectedDetailId) ||
    (aiStep === "select-errors" && selectedErrorIds.length === 0);
  const showBackButton = aiStep === "select-errors";

  const handleNextStep = () => {
    if (aiStep === "select-thought") {
      if (!selectedDetailId) return;
      setAiStep("select-errors");
      return;
    }
    if (aiStep === "select-errors") {
      if (selectedErrorIds.length === 0) return;
      void handleGenerateCandidates(selectedDetailId, selectedErrorIds);
    }
  };

  const handleBackStep = () => {
    if (aiStep === "select-errors") {
      setAiStep("select-thought");
    }
  };

  return (
    <PatternAddSectionShell
      tone="green"
      title="대안적 접근 추가"
      icon={Lightbulb}
      onClose={handleClose}
    >
      <AiActionBar
        aiLabel={
          <>
            <Sparkles size={16} className={styles.icon} />
            {aiButtonLabel}
          </>
        }
        onAiClick={() => void handleAiAction()}
        aiDisabled={loading || aiLoading}
        aiClassName={styles.aiButton}
        saveLabel={loading ? "저장 중" : "저장"}
        onSave={onAddAlternative}
        saveDisabled={!alternativeText.trim() || loading}
        saveClassName={styles.saveButton}
        isSaving={loading}
        saveIcon={<Save size={16} className={styles.icon} />}
        savingIcon={
          <Loader2 size={16} className={`${styles.icon} ${styles.spin}`} />
        }
      />
      <div className={styles.sectionStack}>
        {aiStep === "select-thought" && (
          <SelectionPanel
            title="자동사고 선택"
            description="대안사고를 만들 기준이 되는 자동사고를 골라주세요."
            countText={`${details.length}개`}
            emptyText={
              details.length === 0
                ? "아직 자동사고가 없습니다. 먼저 자동사고를 추가해주세요."
                : undefined
            }
            tone="green"
          >
            {details.map((detail) => {
              const isSelected = selectedDetailId === String(detail.id);
              const emotionLabel = detail.emotion?.trim() || "감정 미선택";
              const thoughtText = detail.automatic_thought?.trim() || "-";
              const isExpanded = expandedDetailIds.includes(String(detail.id));
              return (
                <SelectionCard
                  key={detail.id}
                  selected={isSelected}
                  onSelect={() => handleSelectDetail(String(detail.id))}
                  contentClassName={styles.cardContent}
                  tone="green"
                >
                  <span className={styles.chip}>{emotionLabel}</span>
                  <ExpandableText
                    text={thoughtText}
                    expanded={isExpanded}
                    onToggle={() => toggleDetailExpanded(String(detail.id))}
                    tone="green"
                  />
                </SelectionCard>
              );
            })}
          </SelectionPanel>
        )}
        {aiStep === "select-errors" && (
          <SelectionPanel
            title="인지오류 선택"
            description="1~2개를 선택한 뒤 다음을 눌러주세요."
            countText={`${errorDetails.length}개`}
            emptyText={
              errorDetails.length === 0
                ? "아직 인지오류가 없습니다. 먼저 인지오류를 추가해주세요."
                : undefined
            }
            tone="green"
          >
            {errorDetails.map((error) => {
              const isSelected = selectedErrorIds.includes(String(error.id));
              const description = error.error_description || "설명이 없습니다.";
              const isExpanded = expandedErrorIds.includes(String(error.id));
              return (
                <SelectionCard
                  key={error.id}
                  selected={isSelected}
                  onSelect={() => handleToggleError(String(error.id))}
                  contentClassName={styles.cardContent}
                  tone="green"
                >
                  <p className={styles.errorTitle}>{formatErrorLabel(error)}</p>
                  <ExpandableText
                    text={description}
                    expanded={isExpanded}
                    onToggle={() => toggleErrorExpanded(String(error.id))}
                    tone="green"
                  />
                </SelectionCard>
              );
            })}
          </SelectionPanel>
        )}
      </div>
      {(manualMode || aiStep === "suggestions") && (
        <Textarea
          ref={textareaRef}
          value={alternativeText}
          onChange={(e) => onChangeAlternativeText(e.target.value)}
          placeholder="대안적 사고를 적어주세요."
          className={styles.textarea}
        />
      )}
      <div className={styles.aiStack}>
        {aiLoading && (
          <AiLoadingCard
            title="대안사고 생성 중"
            description="선택한 자동사고와 인지오류를 반영하고 있어요."
            tone="green"
          />
        )}
        {!aiLoading && aiError && (
          <div className={styles.errorBox}>{aiError}</div>
        )}
        {!aiLoading && hasCandidates && (
          <AiCandidatesPanel
            title="AI 대안사고 후보"
            description="클릭하면 입력창에 바로 적용됩니다."
            countText={`${aiCandidates.length}개 추천`}
            tone="green"
          >
            {aiCandidates.map((candidate, index) => {
              const isSelected =
                alternativeText.trim().length > 0 &&
                alternativeText.trim() === candidate.thought.trim();
              return (
                <SelectionCard
                  key={`${candidate.thought}-${index}`}
                  selected={isSelected}
                  onSelect={() => handleSelectCandidate(candidate.thought)}
                  contentClassName={styles.candidateContent}
                  tone="green"
                >
                  <p className={styles.candidateText}>{candidate.thought}</p>
                  <div className={styles.techniqueBox}>
                    <span className={styles.techniqueTitle}>
                      {candidate.technique}
                    </span>
                    <span className={styles.techniqueDescription}>
                      {" "}
                      · {candidate.techniqueDescription}
                    </span>
                  </div>
                </SelectionCard>
              );
            })}
          </AiCandidatesPanel>
        )}
      </div>
      <FloatingStepNav
        show={showFloatingNext}
        onNext={handleNextStep}
        nextDisabled={nextDisabled}
        showBack={showBackButton}
        onBack={handleBackStep}
        tone="green"
      />
    </PatternAddSectionShell>
  );
}
