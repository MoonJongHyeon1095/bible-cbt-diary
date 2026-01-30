"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  BookSearch,
  Check,
  Footprints,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { generateBehaviorSuggestions } from "@/lib/ai";
import { COGNITIVE_ERRORS } from "@/lib/constants/errors";
import { COGNITIVE_BEHAVIORS } from "@/lib/constants/behaviors";
import { getRecommendedBehaviors } from "@/lib/constants/errorBehaviorMap";
import { checkAiUsageLimit } from "@/lib/utils/aiUsageGuard";
import { validateUserText } from "@/components/cbt/utils/validation";
import { useCbtToast } from "@/components/cbt/common/CbtToast";
import FloatingActionButton from "@/components/common/FloatingActionButton";
import BlinkTextarea from "@/components/ui/BlinkTextarea";
import { AiCandidatesPanel } from "../common/AiCandidatesPanel";
import { AiLoadingCard } from "../common/AiLoadingCard";
import { ExpandableText } from "../common/ExpandableText";
import { SelectionCard } from "../common/SelectionCard";
import { SelectionPanel } from "../common/SelectionPanel";
import useEmotionNoteDetail from "../../hooks/useEmotionNoteDetail";
import AddModeSelector, { AddMode } from "./AddModeSelector";
import EmotionNoteAddPageLayout from "./EmotionNoteAddPageLayout";
import { BehaviorOptionSelector, ErrorTagSelector } from "./OptionSelectors";
import SelectionReveal from "./SelectionReveal";
import styles from "./EmotionNoteAddPage.module.css";

type BehaviorAiStep =
  | "select-thought"
  | "select-errors"
  | "select-alternative"
  | "suggestions";
type BehaviorDirectStep = "select-tags" | "select-behavior" | "input";

type EmotionNoteAddBehaviorPageProps = {
  noteId: number;
  mode?: AddMode;
};

export default function EmotionNoteAddBehaviorPage({
  noteId,
  mode: forcedMode,
}: EmotionNoteAddBehaviorPageProps) {
  const router = useRouter();
  const { pushToast } = useCbtToast();
  const {
    accessMode,
    triggerText,
    error,
    thoughtSection,
    errorSection,
    alternativeSection,
    behaviorSection,
  } = useEmotionNoteDetail(noteId);
  const aiLocked = accessMode !== "auth";

  const [mode, setMode] = useState<AddMode | null>(forcedMode ?? null);
  const [aiStep, setAiStep] = useState<BehaviorAiStep>("select-thought");
  const [directStep, setDirectStep] = useState<BehaviorDirectStep>(
    "select-tags",
  );
  const [selectedThoughtId, setSelectedThoughtId] = useState("");
  const [selectedErrorIds, setSelectedErrorIds] = useState<string[]>([]);
  const [selectedAlternativeId, setSelectedAlternativeId] = useState("");
  const [expandedThoughtIds, setExpandedThoughtIds] = useState<string[]>([]);
  const [expandedErrorIds, setExpandedErrorIds] = useState<string[]>([]);
  const [expandedAlternativeIds, setExpandedAlternativeIds] = useState<
    string[]
  >([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [suggestionsById, setSuggestionsById] = useState<
    Record<string, string>
  >({});
  const [savedBehaviorIds, setSavedBehaviorIds] = useState<string[]>([]);
  const [selectedBehaviorId, setSelectedBehaviorId] = useState("");
  const [selectedBehaviorLabel, setSelectedBehaviorLabel] = useState("");
  const [selectedBehaviorDescription, setSelectedBehaviorDescription] =
    useState("");
  const [selectedBehaviorTags, setSelectedBehaviorTags] = useState<string[]>(
    [],
  );
  const [directBehaviorLabel, setDirectBehaviorLabel] = useState("");
  const [directBehaviorTags, setDirectBehaviorTags] = useState<string[]>([]);
  const [directDescription, setDirectDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const lastErrorRef = useRef<string | null>(null);

  useEffect(() => {
    if (error && error !== lastErrorRef.current) {
      pushToast(error, "error");
      lastErrorRef.current = error;
    }
  }, [error, pushToast]);

  useEffect(() => {
    setSuggestionsById({});
    setSavedBehaviorIds([]);
    setSelectedBehaviorId("");
    setSelectedBehaviorLabel("");
    setSelectedBehaviorDescription("");
    setSelectedBehaviorTags([]);
    setAiError(null);
  }, [selectedThoughtId, selectedErrorIds, selectedAlternativeId]);

  const selectedThought = useMemo(
    () =>
      thoughtSection.details.find(
        (detail) => String(detail.id) === selectedThoughtId,
      ) ?? null,
    [selectedThoughtId, thoughtSection.details],
  );
  const selectedErrors = useMemo(
    () =>
      errorSection.details.filter((detail) =>
        selectedErrorIds.includes(String(detail.id)),
      ),
    [errorSection.details, selectedErrorIds],
  );
  const selectedAlternative = useMemo(
    () =>
      alternativeSection.details.find(
        (detail) => String(detail.id) === selectedAlternativeId,
      ) ?? null,
    [selectedAlternativeId, alternativeSection.details],
  );

  const behaviorCandidates = useMemo(() => {
    const behaviorMap = new Map<
      string,
      { behavior: (typeof COGNITIVE_BEHAVIORS)[number]; tags: string[] }
    >();
    selectedErrors.forEach((errorDetail) => {
      const meta = COGNITIVE_ERRORS.find(
        (item) => item.title === errorDetail.error_label,
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
  const selectedDirectBehavior = useMemo(
    () =>
      COGNITIVE_BEHAVIORS.find(
        (behavior) => behavior.replacement_title === directBehaviorLabel,
      ) ?? null,
    [directBehaviorLabel],
  );
  const selectedDirectTagMetas = useMemo(
    () =>
      directBehaviorTags.map((tag) => {
        const meta = COGNITIVE_ERRORS.find((item) => item.title === tag);
        return {
          id: meta?.id ?? null,
          title: tag,
          description: meta?.description ?? "설명이 없습니다.",
        };
      }),
    [directBehaviorTags],
  );
  const directBehaviorOptions = useMemo(() => {
    if (selectedDirectTagMetas.length === 0) {
      return COGNITIVE_BEHAVIORS;
    }
    const byId = new Map<string, (typeof COGNITIVE_BEHAVIORS)[number]>();
    selectedDirectTagMetas.forEach((meta) => {
      if (!meta.id) return;
      getRecommendedBehaviors(meta.id).forEach((behavior) => {
        if (!byId.has(behavior.id)) {
          byId.set(behavior.id, behavior);
        }
      });
    });
    return Array.from(byId.values());
  }, [selectedDirectTagMetas]);

  const handleClose = () => {
    if (mode === "ai") {
      if (aiStep === "suggestions") {
        setAiStep("select-alternative");
        return;
      }
      if (aiStep === "select-alternative") {
        setAiStep("select-errors");
        return;
      }
      if (aiStep === "select-errors") {
        setAiStep("select-thought");
        return;
      }
    }
    if (mode === "direct") {
      if (directStep === "input") {
        setDirectStep("select-behavior");
        return;
      }
      if (directStep === "select-behavior") {
        setDirectStep("select-tags");
        return;
      }
    }
    if (mode && !forcedMode) {
      resetFlow();
      setMode(null);
      return;
    }
    if (forcedMode) {
      router.push(`/detail/${noteId}/add/behavior`);
      return;
    }
    router.push(`/detail/${noteId}`);
  };

  const resetFlow = () => {
    setAiStep("select-thought");
    setDirectStep("select-tags");
    setSelectedThoughtId("");
    setSelectedErrorIds([]);
    setSelectedAlternativeId("");
    setExpandedThoughtIds([]);
    setExpandedErrorIds([]);
    setExpandedAlternativeIds([]);
    setAiError(null);
    setSuggestionsById({});
    setSavedBehaviorIds([]);
    setSelectedBehaviorId("");
    setSelectedBehaviorLabel("");
    setSelectedBehaviorDescription("");
    setSelectedBehaviorTags([]);
    setDirectBehaviorLabel("");
    setDirectBehaviorTags([]);
    setDirectDescription("");
  };

  const handleModeSelect = (next: AddMode) => {
    if (forcedMode) return;
    resetFlow();
    setMode(next);
  };

  useEffect(() => {
    if (!forcedMode) return;
    resetFlow();
    setMode(forcedMode);
  }, [forcedMode]);

  const toggleError = (id: string) => {
    setSelectedErrorIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 2) {
        pushToast("인지오류는 최대 2개까지 선택할 수 있어요.", "error");
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleSelectThought = (id: string) => {
    setSelectedThoughtId(id);
    setSelectedErrorIds([]);
    setSelectedAlternativeId("");
  };

  const handleToggleError = (id: string) => {
    toggleError(id);
    setSelectedAlternativeId("");
  };

  const ensureAiReady = async () => {
    if (aiLocked) {
      pushToast("로그인 후 AI 제안을 사용할 수 있어요.", "error");
      return false;
    }
    const allowed = await checkAiUsageLimit(pushToast);
    if (!allowed) return false;
    if (!triggerText.trim()) {
      pushToast("트리거 텍스트를 먼저 입력해주세요.", "error");
      return false;
    }
    if (!selectedThought || !selectedAlternative) {
      pushToast("자동사고와 대안사고를 먼저 선택해주세요.", "error");
      return false;
    }
    if (selectedErrors.length === 0) {
      pushToast("인지오류를 1~2개 선택해주세요.", "error");
      return false;
    }
    if (behaviorCandidates.length === 0) {
      pushToast("추천 행동이 없습니다.", "error");
      return false;
    }
    return true;
  };

  const handleGenerateSuggestions = async () => {
    const ready = await ensureAiReady();
    if (!ready || !selectedThought || !selectedAlternative) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const suggestions = await generateBehaviorSuggestions(
        triggerText,
        [
          {
            emotion: selectedThought.emotion,
            intensity: null,
            thought: selectedThought.automatic_thought,
          },
        ],
        selectedAlternative.alternative,
        selectedErrors.map((errorDetail) => ({
          title: errorDetail.error_label,
          detail: errorDetail.error_description,
        })),
        behaviorCandidates.map((item) => item.behavior),
        { noteProposal: true },
      );
      const next: Record<string, string> = {};
      suggestions.forEach((item) => {
        next[item.behaviorId] = item.suggestion;
      });
      setSuggestionsById(next);
      setAiStep("suggestions");
    } catch (aiErr) {
      console.error(aiErr);
      setAiError("AI 제안을 불러오지 못했습니다.");
    } finally {
      setAiLoading(false);
    }
  };

  const applySuggestion = (behaviorId: string) => {
    const candidate = behaviorCandidates.find(
      (item) => item.behavior.id === behaviorId,
    );
    if (!candidate) return;
    const suggestion = suggestionsById[behaviorId] ?? "";
    setSelectedBehaviorId(behaviorId);
    setSelectedBehaviorLabel(candidate.behavior.replacement_title);
    setSelectedBehaviorTags(candidate.tags);
    setSelectedBehaviorDescription(suggestion);
  };

  const handleSaveAi = async () => {
    if (!selectedBehaviorLabel.trim() || !selectedBehaviorDescription.trim()) {
      pushToast("행동 반응을 선택해주세요.", "error");
      return;
    }
    if (savedBehaviorIds.includes(selectedBehaviorId)) {
      pushToast("이미 저장된 제안입니다.", "info");
      return;
    }
    setIsSaving(true);
    const ok = await behaviorSection.handleAddWithValues(
      selectedBehaviorLabel.trim(),
      selectedBehaviorDescription.trim(),
      selectedBehaviorTags,
    );
    setIsSaving(false);
    if (ok) {
      setSavedBehaviorIds((prev) =>
        prev.includes(selectedBehaviorId)
          ? prev
          : [...prev, selectedBehaviorId],
      );
      pushToast("행동 반응을 저장했어요.", "success");
    }
  };

  const handleSaveDirect = async () => {
    const validation = validateUserText(directDescription, {
      minLength: 10,
      minLengthMessage: "행동 반응 설명을 10자 이상 입력해주세요.",
    });
    if (!validation.ok) {
      pushToast(validation.message, "error");
      return;
    }
    if (!directBehaviorLabel.trim() || directBehaviorTags.length === 0) {
      pushToast("행동 반응과 인지오류를 선택해주세요.", "error");
      return;
    }
    setIsSaving(true);
    const ok = await behaviorSection.handleAddWithValues(
      directBehaviorLabel.trim(),
      directDescription.trim(),
      directBehaviorTags,
    );
    setIsSaving(false);
    if (ok) {
      pushToast("행동 반응을 저장했어요.", "success");
      router.push(`/detail/${noteId}`);
    }
  };

  const isSelectedSaved = useMemo(
    () => savedBehaviorIds.includes(selectedBehaviorId),
    [savedBehaviorIds, selectedBehaviorId],
  );

  const showAiNext = mode === "ai" && aiStep !== "suggestions";
  const showDirectNext =
    mode === "direct" &&
    (directStep === "select-tags" || directStep === "select-behavior");
  const showAiSave = mode === "ai" && aiStep === "suggestions";
  const showDirectSave = mode === "direct" && directStep === "input";
  const saveLabel = isSelectedSaved ? "저장됨" : "저장";
  const saveIcon = isSelectedSaved ? (
    <Check size={22} />
  ) : (
    <ArrowDownToLine size={22} />
  );

  const nextDisabledAi =
    (aiStep === "select-thought" && !selectedThoughtId) ||
    (aiStep === "select-errors" && selectedErrorIds.length === 0) ||
    (aiStep === "select-alternative" && !selectedAlternativeId);
  const nextDisabledDirect =
    (directStep === "select-tags" && directBehaviorTags.length === 0) ||
    (directStep === "select-behavior" && !directBehaviorLabel.trim());

  const handleAiNext = () => {
    if (aiStep === "select-thought") {
      setAiStep("select-errors");
      return;
    }
    if (aiStep === "select-errors") {
      setAiStep("select-alternative");
      return;
    }
    if (aiStep === "select-alternative") {
      void handleGenerateSuggestions();
    }
  };

  const handleDirectNext = () => {
    if (directStep === "select-tags") {
      if (directBehaviorTags.length === 0) return;
      setDirectStep("select-behavior");
      return;
    }
    if (directStep === "select-behavior") {
      if (!directBehaviorLabel.trim()) return;
      setDirectStep("input");
    }
  };

  return (
    <EmotionNoteAddPageLayout
      title="행동 반응 추가"
      tone="blue"
      icon={Footprints}
      onClose={handleClose}
    >
      <>
        {!forcedMode ? (
          <div className={styles.sectionStack}>
            <p className={styles.sectionTitle}>작성 방식</p>
            <AddModeSelector
              value={mode}
              onSelect={handleModeSelect}
              aiLocked={aiLocked}
            />
          </div>
        ) : null}

          {mode === "ai" && (
            <div className={styles.sectionStack}>
              {!aiLoading && aiStep === "select-thought" && (
                <div className={styles.stepCenter}>
                  <SelectionPanel
                    title="자동사고 선택"
                    description="행동 반응 제안을 만들 기준 자동사고를 골라주세요."
                    countText={`${thoughtSection.details.length}개`}
                    emptyText={
                      thoughtSection.details.length === 0
                        ? "아직 자동사고가 없습니다. 먼저 자동사고를 추가해주세요."
                        : undefined
                    }
                  >
                    {thoughtSection.details.map((detail) => {
                      const isSelected = selectedThoughtId === String(detail.id);
                      const emotionLabel =
                        detail.emotion?.trim() || "감정 미선택";
                      const thoughtText =
                        detail.automatic_thought?.trim() || "-";
                      const isExpanded = expandedThoughtIds.includes(
                        String(detail.id),
                      );
                      return (
                        <SelectionCard
                          key={detail.id}
                          selected={isSelected}
                          onSelect={() => handleSelectThought(String(detail.id))}
                        >
                          <span className={styles.selectedChip}>
                            {emotionLabel}
                          </span>
                          <ExpandableText
                            text={thoughtText}
                            expanded={isExpanded}
                            onToggle={() =>
                              setExpandedThoughtIds((prev) =>
                                prev.includes(String(detail.id))
                                  ? prev.filter((id) => id !== String(detail.id))
                                  : [...prev, String(detail.id)],
                              )
                            }
                          />
                        </SelectionCard>
                      );
                    })}
                  </SelectionPanel>
                </div>
              )}
              {!aiLoading && aiStep === "select-errors" && (
                <div className={styles.stepCenter}>
                  <SelectionPanel
                    title="인지오류 선택"
                    description="1~2개를 선택하고 다음으로 이동해주세요."
                    countText={`${errorSection.details.length}개`}
                    emptyText={
                      errorSection.details.length === 0
                        ? "아직 인지오류가 없습니다. 먼저 인지오류를 추가해주세요."
                        : undefined
                    }
                  >
                    {errorSection.details.map((errorDetail) => {
                      const isSelected = selectedErrorIds.includes(
                        String(errorDetail.id),
                      );
                      const description =
                        errorDetail.error_description || "설명이 없습니다.";
                      const isExpanded = expandedErrorIds.includes(
                        String(errorDetail.id),
                      );
                      return (
                        <SelectionCard
                          key={errorDetail.id}
                          selected={isSelected}
                          onSelect={() => handleToggleError(String(errorDetail.id))}
                        >
                          <p className={styles.sectionTitle}>
                            {errorDetail.error_label}
                          </p>
                          <ExpandableText
                            text={description}
                            expanded={isExpanded}
                            onToggle={() =>
                              setExpandedErrorIds((prev) =>
                                prev.includes(String(errorDetail.id))
                                  ? prev.filter((id) => id !== String(errorDetail.id))
                                  : [...prev, String(errorDetail.id)],
                              )
                            }
                          />
                        </SelectionCard>
                      );
                    })}
                  </SelectionPanel>
                </div>
              )}

              {!aiLoading && aiStep === "select-alternative" && (
                <div className={styles.stepCenter}>
                  <SelectionPanel
                    title="대안적 접근 선택"
                    description="1개를 선택한 뒤 다음을 눌러주세요."
                    countText={`${alternativeSection.details.length}개`}
                    emptyText={
                      alternativeSection.details.length === 0
                        ? "아직 대안적 접근이 없습니다. 먼저 추가해주세요."
                        : undefined
                    }
                  >
                    {alternativeSection.details.map((alternative) => {
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
                            setSelectedAlternativeId(String(alternative.id))
                          }
                        >
                          <ExpandableText
                            text={text}
                            expanded={isExpanded}
                            onToggle={() =>
                              setExpandedAlternativeIds((prev) =>
                                prev.includes(String(alternative.id))
                                  ? prev.filter((id) => id !== String(alternative.id))
                                  : [...prev, String(alternative.id)],
                              )
                            }
                          />
                        </SelectionCard>
                      );
                    })}
                  </SelectionPanel>
                </div>
              )}

              {aiLoading && (
                <div className={styles.stepCenter}>
                  <AiLoadingCard
                    title="행동 반응 생성 중"
                    description="선택한 내용을 기반으로 행동 제안을 만들고 있어요."
                    tone="blue"
                  />
                </div>
              )}

              {!aiLoading && aiError && (
                <div className={styles.errorBox}>{aiError}</div>
              )}

              {!aiLoading && aiStep === "suggestions" && (
                <AiCandidatesPanel
                  title="AI 행동 반응 후보"
                  description="원하는 행동을 선택한 뒤 저장하세요."
                  countText={`${behaviorCandidates.length}개 추천`}
                  tone="blue"
                >
                  <div className={styles.candidateList}>
                    {behaviorCandidates.map((candidate, index) => {
                      const suggestion =
                        suggestionsById[candidate.behavior.id] ?? "";
                      const isSelected =
                        selectedBehaviorId === candidate.behavior.id;
                      const saved = savedBehaviorIds.includes(
                        candidate.behavior.id,
                      );
                      return (
                        <SelectionCard
                          key={`${candidate.behavior.id}-${index}`}
                          selected={isSelected}
                          saved={saved}
                          onSelect={() =>
                            applySuggestion(candidate.behavior.id)
                          }
                          tone="blue"
                        >
                          <p className={styles.sectionTitle}>
                            {candidate.behavior.replacement_title}
                          </p>
                          {suggestion ? (
                            <p className={styles.sectionHint}>{suggestion}</p>
                          ) : null}
                          <div className={styles.inlineNote}>
                            {candidate.tags.map((tag) => `#${tag}`).join(" ")}
                          </div>
                        </SelectionCard>
                      );
                    })}
                  </div>
                </AiCandidatesPanel>
              )}
            </div>
          )}

          {mode === "direct" && (
            <div className={styles.sectionStack}>
              {directStep === "select-tags" && (
                <div className={styles.stepCenter}>
                  <div className={styles.selectionRow}>
                    <p className={styles.sectionTitle}>
                      인지오류 선택 (최대 2개)
                    </p>
                    <ErrorTagSelector
                      values={directBehaviorTags}
                      maxSelected={2}
                      onToggle={(tag) => {
                        setDirectBehaviorTags((prev) =>
                          prev.includes(tag)
                            ? prev.filter((item) => item !== tag)
                            : [...prev, tag],
                        );
                      }}
                    />
                    <SelectionReveal
                      isVisible={selectedDirectTagMetas.length > 0}
                    >
                      {selectedDirectTagMetas.length > 0 ? (
                        <div className={styles.revealInner}>
                          <div className={styles.revealList}>
                            {selectedDirectTagMetas.map((tag) => (
                              <div
                                key={tag.title}
                                className={styles.revealListItem}
                              >
                                <span>•</span>
                                <span>
                                  {tag.title} - {tag.description}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </SelectionReveal>
                  </div>
                </div>
              )}

              {directStep === "select-behavior" && (
                <div className={styles.stepCenter}>
                  <div className={styles.selectionRow}>
                    <p className={styles.sectionTitle}>행동 반응 선택</p>
                    <BehaviorOptionSelector
                      value={directBehaviorLabel}
                      onSelect={setDirectBehaviorLabel}
                      options={directBehaviorOptions}
                    />
                    <SelectionReveal
                      isVisible={Boolean(selectedDirectBehavior)}
                    >
                      {selectedDirectBehavior ? (
                        <div className={styles.revealInner}>
                          <p className={styles.revealTitle}>
                            {selectedDirectBehavior.replacement_title}
                          </p>
                          {selectedDirectBehavior.description ? (
                            <p className={styles.revealText}>
                              {selectedDirectBehavior.description}
                            </p>
                          ) : null}
                          {selectedDirectBehavior.usage_description ? (
                            <p className={styles.revealText}>
                              {selectedDirectBehavior.usage_description}
                            </p>
                          ) : null}
                        </div>
                      ) : null}
                    </SelectionReveal>
                  </div>
                </div>
              )}

              {directStep === "input" && (
                <>
                  {(directBehaviorLabel.trim() ||
                    directBehaviorTags.length > 0) && (
                    <details className={styles.summaryBox}>
                      <summary className={styles.summaryToggle}>
                        선택한 내용 보기
                      </summary>
                      <div className={styles.summaryBody}>
                        {directBehaviorLabel.trim() ? (
                          <>
                            <p className={styles.summaryLabel}>행동 반응</p>
                            <div className={styles.revealList}>
                              <div className={styles.revealListItem}>
                                <span>•</span>
                                <span>{directBehaviorLabel}</span>
                              </div>
                            </div>
                          </>
                        ) : null}
                        {selectedDirectTagMetas.length > 0 ? (
                          <>
                            <p className={styles.summaryLabel}>인지오류</p>
                            <div className={styles.revealList}>
                              {selectedDirectTagMetas.map((tag) => (
                                <div
                                  key={tag.title}
                                  className={styles.revealListItem}
                                >
                                  <span>•</span>
                                  <span>{tag.title}</span>
                                </div>
                              ))}
                            </div>
                          </>
                        ) : null}
                      </div>
                    </details>
                  )}
                  <div className={styles.inputStack}>
                    <BlinkTextarea
                      value={directDescription}
                      onChange={setDirectDescription}
                      placeholder="행동 반응 설명을 적어주세요."
                    />
                    <p className={styles.helperText}>
                      입력한 내용은 바로 행동 반응으로 저장됩니다.
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
      </>

      {showAiNext && (
        <FloatingActionButton
            label="다음"
            icon={<ArrowRight size={22} />}
            helperText="다음"
            onClick={handleAiNext}
            disabled={nextDisabledAi || aiLoading}
            loading={aiLoading}
            className={styles.fab}
          />
      )}
      {showDirectNext && (
        <FloatingActionButton
            label="다음"
            icon={<ArrowRight size={22} />}
            helperText="다음"
            onClick={handleDirectNext}
            disabled={nextDisabledDirect}
            className={styles.fab}
          />
      )}
      {showAiSave && (
        <>
          <FloatingActionButton
            label={saveLabel}
            icon={saveIcon}
            helperText="행동 반응 저장"
            onClick={() => void handleSaveAi()}
            disabled={
              !selectedBehaviorLabel.trim() || isSaving || isSelectedSaved
            }
            loading={isSaving}
            className={`${styles.fab} ${styles.fabSave}`}
          />
          <FloatingActionButton
            label="노트로 돌아가기"
            icon={<BookSearch size={20} />}
            helperText="노트로 돌아가기"
            onClick={() => router.push(`/detail/${noteId}`)}
            className={`${styles.fabSecondary} ${styles.fabSaveSecondary}`}
          />
        </>
      )}
      {showDirectSave && (
        <FloatingActionButton
          label="저장"
          icon={<ArrowDownToLine size={22} />}
          helperText="행동 반응 저장"
          onClick={() => void handleSaveDirect()}
          disabled={isSaving}
          loading={isSaving}
          className={`${styles.fab} ${styles.fabSave}`}
        />
      )}
    </EmotionNoteAddPageLayout>
  );
}
