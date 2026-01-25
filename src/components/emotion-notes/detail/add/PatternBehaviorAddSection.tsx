"use client";

import Textarea from "@/components/ui/Textarea";
import { generateBehaviorSuggestions } from "@/lib/ai";
import { COGNITIVE_BEHAVIORS } from "@/lib/constants/behaviors";
import { getRecommendedBehaviors } from "@/lib/constants/errorBehaviorMap";
import { COGNITIVE_ERRORS } from "@/lib/constants/errors";
import { clearTokenSessionStorage } from "@/lib/utils/tokenSessionStorage";
import { Check, Footprints, Info, Loader2, Save, Sparkles } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import { useCbtToast } from "@/components/cbt/common/CbtToast";

import {
  EmotionNoteAlternativeDetail,
  EmotionNoteDetail,
  EmotionNoteErrorDetail,
} from "@/lib/types/types";
import { checkAiUsageLimit } from "@/lib/utils/aiUsageGuard";
import { BehaviorSelector } from "./PatternSelectors";
import { AiActionBar } from "./common/AiActionBar";
import { AiCandidatesPanel } from "./common/AiCandidatesPanel";
import { AiLoadingCard } from "./common/AiLoadingCard";
import { ExpandableText } from "./common/ExpandableText";
import { FloatingStepNav } from "./common/FloatingStepNav";
import { PatternAddSectionShell } from "./common/PatternAddSectionShell";
import { SelectionCard } from "./common/SelectionCard";
import { SelectionPanel } from "./common/SelectionPanel";
import styles from "./PatternBehaviorAddSection.module.css";
import { CognitiveErrorInfoPopover } from "./pop-over/CognitiveErrorInfoPopover";
import { getCognitiveErrorMeta } from "./pop-over/InfoPopoverMeta";

interface PatternBehaviorAddSectionProps {
  triggerText: string;
  details: EmotionNoteDetail[];
  errorDetails: EmotionNoteErrorDetail[];
  alternatives: EmotionNoteAlternativeDetail[];
  behaviorLabel: string;
  behaviorDescription: string;
  behaviorErrorTags: string[];
  loading: boolean;
  onChangeBehaviorLabel: (value: string) => void;
  onChangeBehaviorDescription: (value: string) => void;
  onChangeBehaviorErrorTags: (value: string[]) => void;
  onAddBehaviorDetail: () => void;
  onClose?: () => void;
}

export function PatternBehaviorAddSection({
  triggerText,
  details,
  errorDetails,
  alternatives,
  behaviorLabel = "",
  behaviorDescription = "",
  behaviorErrorTags = [],
  loading,
  onChangeBehaviorLabel,
  onChangeBehaviorDescription,
  onChangeBehaviorErrorTags,
  onAddBehaviorDetail,
  onClose,
}: PatternBehaviorAddSectionProps) {
  const { pushToast } = useCbtToast();
  const [aiStep, setAiStep] = useState<
    | "idle"
    | "select-thought"
    | "select-errors"
    | "select-alternative"
    | "loading"
    | "suggestions"
  >("idle");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [selectedDetailId, setSelectedDetailId] = useState("");
  const [selectedErrorIds, setSelectedErrorIds] = useState<string[]>([]);
  const [selectedAlternativeId, setSelectedAlternativeId] = useState("");
  const [expandedDetailIds, setExpandedDetailIds] = useState<string[]>([]);
  const [expandedErrorIds, setExpandedErrorIds] = useState<string[]>([]);
  const [expandedAlternativeIds, setExpandedAlternativeIds] = useState<
    string[]
  >([]);
  const [suggestionsById, setSuggestionsById] = useState<
    Record<string, string>
  >({});
  const generateTimerRef = useRef<number | null>(null);

  const selectedDetail = useMemo(
    () =>
      details.find((detail) => String(detail.id) === selectedDetailId) ?? null,
    [details, selectedDetailId],
  );
  const selectedErrors = useMemo(
    () =>
      selectedErrorIds
        .map((id) => errorDetails.find((error) => String(error.id) === id))
        .filter((error): error is EmotionNoteErrorDetail => Boolean(error)),
    [errorDetails, selectedErrorIds],
  );

  const behaviorCandidates = useMemo(() => {
    const behaviorMap = new Map<
      string,
      { behavior: (typeof COGNITIVE_BEHAVIORS)[number]; tags: string[] }
    >();
    selectedErrors.forEach((error) => {
      const meta = COGNITIVE_ERRORS.find(
        (item) => item.title === error.error_label,
      );
      if (!meta) return;
      const behaviors = getRecommendedBehaviors(meta.id);
      behaviors.forEach((behavior) => {
        const existing = behaviorMap.get(behavior.id);
        if (existing) {
          if (!existing.tags.includes(meta.title)) {
            existing.tags.push(meta.title);
          }
          return;
        }
        behaviorMap.set(behavior.id, {
          behavior,
          tags: [meta.title],
        });
      });
    });
    return Array.from(behaviorMap.values()).slice(0, 6);
  }, [selectedErrors]);

  useEffect(() => {
    if (generateTimerRef.current) {
      window.clearTimeout(generateTimerRef.current);
      generateTimerRef.current = null;
    }
    setAiError(null);
  }, [selectedDetailId, selectedErrorIds, selectedAlternativeId]);

  useEffect(() => {
    return () => {
      if (generateTimerRef.current) {
        window.clearTimeout(generateTimerRef.current);
        generateTimerRef.current = null;
      }
    };
  }, []);

  const startAiSelection = () => {
    setSelectedDetailId("");
    setSelectedErrorIds([]);
    setSelectedAlternativeId("");
    setSuggestionsById({});
    setAiError(null);
    onChangeBehaviorLabel("");
    onChangeBehaviorDescription("");
    onChangeBehaviorErrorTags([]);
    setAiStep("select-thought");
  };

  const handleAiAction = async () => {
    const allowed = await checkAiUsageLimit(pushToast);
    if (!allowed) return;
    startAiSelection();
  };

  const handleClose = async () => {
    await clearTokenSessionStorage();
    onClose?.();
  };

  const handleSelectDetail = (detailId: string) => {
    setSelectedDetailId(detailId);
    setSelectedErrorIds([]);
    setSelectedAlternativeId("");
  };

  const handleToggleError = (errorId: string) => {
    setSelectedErrorIds((prev) => {
      if (prev.includes(errorId)) {
        return prev.filter((id) => id !== errorId);
      }
      if (prev.length >= 2) {
        pushToast("인지오류는 최대 2개까지 선택할 수 있어요.", "error");
        return prev;
      }
      return [...prev, errorId];
    });
  };

  const toggleExpanded = (
    setter: Dispatch<SetStateAction<string[]>>,
    id: string,
  ) => {
    setter((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleGenerateSuggestions = async (
    detail: EmotionNoteDetail,
    errors: EmotionNoteErrorDetail[],
    alternative: EmotionNoteAlternativeDetail,
  ) => {
    if (!triggerText.trim()) return;
    if (!detail) return;
    if (errors.length === 0) return;
    if (!alternative) return;
    if (behaviorCandidates.length === 0) {
      setAiError("추천 행동이 없습니다.");
      return;
    }

    setAiLoading(true);
    setAiError(null);
    setAiStep("loading");
    try {
      const suggestions = await generateBehaviorSuggestions(
        triggerText,
        [
          {
            emotion: detail.emotion,
            intensity: null,
            thought: detail.automatic_thought,
          },
        ],
        alternative.alternative,
        errors.map((error) => ({
          title: error.error_label,
          detail: error.error_description,
        })),
        behaviorCandidates.map((item) => item.behavior),
      );
      const next: Record<string, string> = {};
      suggestions.forEach((item) => {
        next[item.behaviorId] = item.suggestion;
      });
      setSuggestionsById(next);
      setAiStep("suggestions");
    } catch (error) {
      console.error("행동 제안 생성 오류:", error);
      setAiError("AI 제안을 불러오지 못했습니다.");
      setAiStep("select-alternative");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSelectAlternative = (alternativeId: string) => {
    setSelectedAlternativeId(alternativeId);
  };

  const applySuggestion = (behaviorId: string, suggestion: string) => {
    const behavior = behaviorCandidates.find(
      (item) => item.behavior.id === behaviorId,
    );
    if (!behavior) return;
    onChangeBehaviorLabel(behavior.behavior.replacement_title);
    onChangeBehaviorDescription(suggestion);
    onChangeBehaviorErrorTags(behavior.tags);
  };

  const manualMode = aiStep === "idle";
  const hasAiSuggestions =
    aiStep === "suggestions" && behaviorCandidates.length > 0;
  const showAiSelectionSummary =
    !manualMode && (behaviorLabel.trim() || behaviorErrorTags.length > 0);
  const showFloatingNext =
    aiStep === "select-thought" ||
    aiStep === "select-errors" ||
    aiStep === "select-alternative";

  const handleNextStep = () => {
    if (aiStep === "select-thought") {
      if (!selectedDetailId) {
        pushToast("자동사고를 1개 선택해주세요.", "error");
        return;
      }
      setAiStep("select-errors");
      return;
    }
    if (aiStep === "select-errors") {
      if (selectedErrorIds.length === 0) {
        pushToast("인지오류를 1~2개 선택해주세요.", "error");
        return;
      }
      setAiStep("select-alternative");
      return;
    }
    if (aiStep === "select-alternative") {
      const detail = selectedDetail;
      const alternative =
        alternatives.find((alt) => String(alt.id) === selectedAlternativeId) ??
        null;
      if (!detail) {
        pushToast("자동사고를 먼저 선택해주세요.", "error");
        setAiStep("select-thought");
        return;
      }
      if (selectedErrors.length === 0) {
        pushToast("인지오류를 1~2개 선택해주세요.", "error");
        setAiStep("select-errors");
        return;
      }
      if (!alternative) {
        pushToast("대안적 접근을 1개 선택해주세요.", "error");
        return;
      }
      void handleGenerateSuggestions(detail, selectedErrors, alternative);
    }
  };

  const nextDisabled =
    (aiStep === "select-thought" && !selectedDetailId) ||
    (aiStep === "select-errors" && selectedErrorIds.length === 0) ||
    (aiStep === "select-alternative" && !selectedAlternativeId);
  const showBackButton =
    aiStep === "select-errors" || aiStep === "select-alternative";

  const handleBackStep = () => {
    if (aiStep === "select-alternative") {
      setAiStep("select-errors");
      return;
    }
    if (aiStep === "select-errors") {
      setAiStep("select-thought");
    }
  };

  return (
    <PatternAddSectionShell
      tone="blue"
      title="행동 반응 추가"
      icon={Footprints}
      onClose={handleClose}
    >
      <AiActionBar
        aiLabel={
          <>
            <Sparkles size={16} className={styles.icon} />
            {hasAiSuggestions ? "다시 제안" : "AI 제안"}
          </>
        }
        onAiClick={() => void handleAiAction()}
        aiDisabled={loading || aiLoading}
        aiClassName={styles.aiButton}
        saveLabel={loading ? "저장 중" : "저장"}
        onSave={onAddBehaviorDetail}
        saveDisabled={!behaviorLabel.trim() || loading}
        saveClassName={styles.saveButton}
        isSaving={loading}
        saveIcon={<Save size={16} className={styles.icon} />}
        savingIcon={<Loader2 size={16} className={`${styles.icon} ${styles.spin}`} />}
      />
      {!manualMode && (
        <div className={styles.stackMd}>
          {aiStep === "select-thought" && (
            <SelectionPanel
              title="자동사고 선택"
              description="행동 반응 제안을 만들 기준 자동사고를 골라주세요."
              countText={`${details.length}개`}
              emptyText={
                details.length === 0
                  ? "아직 자동사고가 없습니다. 먼저 자동사고를 추가해주세요."
                  : undefined
              }
            >
              {details.map((detail) => {
                const isSelected = selectedDetailId === String(detail.id);
                const emotionLabel = detail.emotion?.trim() || "감정 미선택";
                const thoughtText = detail.automatic_thought?.trim() || "-";
                const isExpanded = expandedDetailIds.includes(
                  String(detail.id),
                );
                return (
                  <SelectionCard
                    key={detail.id}
                    selected={isSelected}
                    onSelect={() => handleSelectDetail(String(detail.id))}
                    contentClassName={styles.cardContent}
                  >
                    <span className={styles.chip}>
                      {emotionLabel}
                    </span>
                    <ExpandableText
                      text={thoughtText}
                      expanded={isExpanded}
                      onToggle={() =>
                        toggleExpanded(setExpandedDetailIds, String(detail.id))
                      }
                    />
                  </SelectionCard>
                );
              })}
            </SelectionPanel>
          )}
          {aiStep === "select-errors" && (
            <SelectionPanel
              title="인지오류 선택"
              description="1~2개를 선택하고 다음으로 이동해주세요."
              countText={`${errorDetails.length}개`}
              emptyText={
                errorDetails.length === 0
                  ? "아직 인지오류가 없습니다. 먼저 인지오류를 추가해주세요."
                  : undefined
              }
            >
              {errorDetails.map((error) => {
                const isSelected = selectedErrorIds.includes(String(error.id));
                const description =
                  error.error_description || "설명이 없습니다.";
                const isExpanded = expandedErrorIds.includes(String(error.id));
                return (
                  <SelectionCard
                    key={error.id}
                    selected={isSelected}
                    onSelect={() => handleToggleError(String(error.id))}
                    contentClassName={styles.cardContent}
                  >
                    <p className={styles.cardTitle}>{error.error_label}</p>
                    <ExpandableText
                      text={description}
                      expanded={isExpanded}
                      onToggle={() =>
                        toggleExpanded(setExpandedErrorIds, String(error.id))
                      }
                    />
                  </SelectionCard>
                );
              })}
            </SelectionPanel>
          )}
          {aiStep === "select-alternative" && (
            <SelectionPanel
              title="대안적 접근 선택"
              description="1개를 선택한 뒤 다음을 눌러주세요."
              countText={`${alternatives.length}개`}
              emptyText={
                alternatives.length === 0
                  ? "아직 대안적 접근이 없습니다. 먼저 추가해주세요."
                  : undefined
              }
              emptyTextClassName={styles.emptyText}
            >
              {alternatives.map((alternative) => {
                const isSelected =
                  selectedAlternativeId === String(alternative.id);
                const text = alternative.alternative?.trim() || "-";
                const isExpanded = expandedAlternativeIds.includes(
                  String(alternative.id),
                );
                return (
                  <SelectionCard
                    key={alternative.id}
                    selected={isSelected}
                    onSelect={() =>
                      handleSelectAlternative(String(alternative.id))
                    }
                    contentClassName={styles.cardContent}
                  >
                    <ExpandableText
                      text={text}
                      expanded={isExpanded}
                      onToggle={() =>
                        toggleExpanded(
                          setExpandedAlternativeIds,
                          String(alternative.id),
                        )
                      }
                    />
                  </SelectionCard>
                );
              })}
            </SelectionPanel>
          )}
        </div>
      )}
      {manualMode && (
        <div>
          <p className={styles.label}>행동 반응 선택</p>
          <BehaviorSelector
            value={behaviorLabel}
            onSelect={onChangeBehaviorLabel}
          />
        </div>
      )}
      {showAiSelectionSummary && behaviorLabel.trim() && (
        <div>
          <p className={styles.label}>선택된 행동</p>
          <div className={styles.selectedBehavior}>
            {behaviorLabel}
          </div>
        </div>
      )}
      {(manualMode || hasAiSuggestions) && (
        <Textarea
          value={behaviorDescription}
          onChange={(e) => onChangeBehaviorDescription(e.target.value)}
          placeholder="행동 반응 설명"
          className={styles.textarea}
        />
      )}
      {manualMode && (
        <div>
          <p className={styles.label}>인지오류 태그 선택 (복수 가능)</p>
          <div className={styles.tagList}>
            {COGNITIVE_ERRORS.map((error) => {
              const selected = behaviorErrorTags.includes(error.title);
              const meta = getCognitiveErrorMeta(error.title);
              return (
                <button
                  key={error.id}
                  type="button"
                  onClick={() => {
                    if (selected) {
                      onChangeBehaviorErrorTags(
                        behaviorErrorTags.filter((tag) => tag !== error.title),
                      );
                      return;
                    }
                    onChangeBehaviorErrorTags([
                      ...behaviorErrorTags,
                      error.title,
                    ]);
                  }}
                  className={[
                    styles.tagButton,
                    selected ? styles.tagButtonSelected : "",
                  ].join(" ")}
                >
                  <span className={styles.tagInline}>
                    <span>{error.title}</span>
                    {selected && meta && (
                      <CognitiveErrorInfoPopover
                        errorLabel={meta.title}
                        caption="태그 설명"
                        tone="blue"
                      >
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(event) => event.stopPropagation()}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.stopPropagation();
                            }
                          }}
                          className={styles.tagInfoIcon}
                          aria-label={`${meta.title} 설명 보기`}
                        >
                          <Info size={12} />
                        </span>
                      </CognitiveErrorInfoPopover>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
      {showAiSelectionSummary && behaviorErrorTags.length > 0 && (
        <div>
          <p className={styles.label}>인지오류 태그</p>
          <div className={styles.tagList}>
            {behaviorErrorTags.map((tag) => {
              const meta = getCognitiveErrorMeta(tag);
              return (
                <span
                  key={tag}
                  className={styles.tagSummary}
                >
                  <span>{tag}</span>
                  {meta && (
                    <span className={styles.tagSummaryIcon}>
                      <Info size={12} />
                    </span>
                  )}
                </span>
              );
            })}
          </div>
        </div>
      )}
      <div className={styles.stackSm}>
        {aiLoading && (
          <AiLoadingCard
            title="행동 반응 생성 중"
            description="선택한 내용을 기반으로 행동 제안을 만들고 있어요."
          />
        )}
        {!aiLoading && aiError && (
          <div className={styles.errorBox}>{aiError}</div>
        )}
        {!aiLoading && hasAiSuggestions && (
          <AiCandidatesPanel
            title="AI 행동 반응 후보"
            description="클릭하면 설명이 입력창에 적용됩니다."
            countText={`${behaviorCandidates.length}개 추천`}
          >
            {behaviorCandidates.map((item, index) => {
              const suggestion = suggestionsById[item.behavior.id] ?? "";
              const isSelected =
                behaviorLabel.trim() === item.behavior.replacement_title &&
                behaviorDescription.trim() === suggestion.trim();
              return (
                <button
                  key={item.behavior.id}
                  type="button"
                  onClick={() => applySuggestion(item.behavior.id, suggestion)}
                  className={[
                    styles.candidateButton,
                    isSelected ? styles.candidateSelected : "",
                  ].join(" ")}
                  aria-pressed={isSelected}
                >
                  <span
                    className={[
                      styles.candidateIndex,
                      isSelected ? styles.candidateIndexSelected : "",
                    ].join(" ")}
                  >
                    {index + 1}
                  </span>
                  <div className={styles.candidateBody}>
                    <div className={styles.candidateHeader}>
                      <p className={styles.cardTitle}>
                        {item.behavior.replacement_title}
                      </p>
                      <div className={styles.candidateTags}>
                        {item.tags.map((tag) => (
                          <span
                            key={`${item.behavior.id}-${tag}`}
                            className={styles.candidateTag}
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className={styles.candidateDescription}>
                      {suggestion || "AI 응답을 기다리는 중입니다."}
                    </p>
                  </div>
                  <span
                    className={[
                      styles.candidateStatus,
                      isSelected ? styles.candidateStatusActive : "",
                    ].join(" ")}
                  >
                    {isSelected ? (
                      <>
                        <Check size={12} />
                        적용됨
                      </>
                    ) : (
                      "적용"
                    )}
                  </span>
                </button>
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
        tone="blue"
      />
    </PatternAddSectionShell>
  );
}
