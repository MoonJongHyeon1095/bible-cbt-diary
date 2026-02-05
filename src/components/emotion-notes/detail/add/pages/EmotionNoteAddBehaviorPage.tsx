"use client";

import { useCbtToast } from "@/components/cbt/common/CbtToast";
import { validateUserText } from "@/components/cbt/utils/validation";
import AiFallbackNotice from "@/components/common/AiFallbackNotice";
import FloatingActionButton from "@/components/common/FloatingActionButton";
import { useAuthModal } from "@/components/header/AuthModalProvider";
import BlinkTextarea from "@/components/ui/BlinkTextarea";
import { generateBehaviorSuggestions } from "@/lib/ai";
import { COGNITIVE_BEHAVIORS } from "@/lib/constants/behaviors";
import { getRecommendedBehaviors } from "@/lib/constants/errorBehaviorMap";
import { COGNITIVE_ERRORS } from "@/lib/constants/errors";
import { useAiUsageGuard } from "@/lib/hooks/useAiUsageGuard";
import { isAiFallback } from "@/lib/utils/aiFallback";
import {
  ArrowDownToLine,
  ArrowRight,
  BookSearch,
  Check,
  Footprints,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import useEmotionNoteDetail from "../../hooks/useEmotionNoteDetail";
import { AiCandidatesPanel } from "../common/AiCandidatesPanel";
import { AiLoadingCard } from "../common/AiLoadingCard";
import { ExpandableText } from "../common/ExpandableText";
import { SelectionCard } from "../common/SelectionCard";
import { SelectionPanel } from "../common/SelectionPanel";
import { useAddFlow } from "../common/useAddFlow";
import { toggleListValue } from "../common/toggleList";
import EmotionNoteAddModeSelector, {
  AddMode,
} from "./EmotionNoteAddModeSelector";
import {
  BehaviorOptionSelector,
  ErrorTagSelector,
} from "./EmotionNoteAddOptionSelectors";
import styles from "./EmotionNoteAddPage.module.css";
import EmotionNoteAddPageLayout from "./EmotionNoteAddPageLayout";
import EmotionNoteAddSelectionReveal from "./EmotionNoteAddSelectionReveal";
import EmotionNoteAddSummaryItem from "./EmotionNoteAddSummaryItem";

type EmotionNoteAddBehaviorPageProps = {
  noteId: number;
  mode?: AddMode;
};

type LocalState = {
  selectedThoughtId: string;
  selectedErrorIds: string[];
  selectedAlternativeId: string;
  expandedThoughtIds: string[];
  expandedErrorIds: string[];
  expandedAlternativeIds: string[];
  suggestionsById: Record<string, string>;
  savedBehaviorIds: string[];
  selectedBehaviorId: string;
  selectedBehaviorLabel: string;
  selectedBehaviorDescription: string;
  selectedBehaviorTags: string[];
  directBehaviorLabel: string;
  directBehaviorTags: string[];
  directDescription: string;
};

type LocalAction =
  | { type: "PATCH"; patch: Partial<LocalState> }
  | { type: "RESET" };

const initialLocalState: LocalState = {
  selectedThoughtId: "",
  selectedErrorIds: [],
  selectedAlternativeId: "",
  expandedThoughtIds: [],
  expandedErrorIds: [],
  expandedAlternativeIds: [],
  suggestionsById: {},
  savedBehaviorIds: [],
  selectedBehaviorId: "",
  selectedBehaviorLabel: "",
  selectedBehaviorDescription: "",
  selectedBehaviorTags: [],
  directBehaviorLabel: "",
  directBehaviorTags: [],
  directDescription: "",
};

const localReducer = (state: LocalState, action: LocalAction): LocalState => {
  switch (action.type) {
    case "PATCH":
      return { ...state, ...action.patch };
    case "RESET":
      return initialLocalState;
    default:
      return state;
  }
};

export default function EmotionNoteAddBehaviorPage({
  noteId,
  mode: forcedMode,
}: EmotionNoteAddBehaviorPageProps) {
  const router = useRouter();
  const { pushToast } = useCbtToast();
  const { openAuthModal } = useAuthModal();
  const { checkUsage } = useAiUsageGuard({
    enabled: false,
    cache: true,
    redirectTo: null,
  });
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

  const [local, localDispatch] = useReducer(localReducer, initialLocalState);
  const patchLocal = useCallback(
    (patch: Partial<LocalState>) =>
      localDispatch({ type: "PATCH", patch }),
    [],
  );
  const { state: flow, actions: flowActions } = useAddFlow({
    initialMode: forcedMode ?? null,
    initialAiStep: "select-thought",
    initialDirectStep: "select-tags",
  });
  const lastErrorRef = useRef<string | null>(null);

  useEffect(() => {
    if (error && error !== lastErrorRef.current) {
      pushToast(error, "error");
      lastErrorRef.current = error;
    }
  }, [error, pushToast]);

  useEffect(() => {
    patchLocal({
      suggestionsById: {},
      savedBehaviorIds: [],
      selectedBehaviorId: "",
      selectedBehaviorLabel: "",
      selectedBehaviorDescription: "",
      selectedBehaviorTags: [],
    });
    flowActions.setAiError(null);
    flowActions.setAiFallback(false);
  }, [
    flowActions,
    local.selectedAlternativeId,
    local.selectedErrorIds,
    local.selectedThoughtId,
    patchLocal,
  ]);

  const selectedThought = useMemo(
    () =>
      thoughtSection.details.find(
        (detail) => String(detail.id) === local.selectedThoughtId,
      ) ?? null,
    [local.selectedThoughtId, thoughtSection.details],
  );
  const selectedErrors = useMemo(
    () =>
      errorSection.details.filter((detail) =>
        local.selectedErrorIds.includes(String(detail.id)),
      ),
    [errorSection.details, local.selectedErrorIds],
  );
  const selectedAlternative = useMemo(
    () =>
      alternativeSection.details.find(
        (detail) => String(detail.id) === local.selectedAlternativeId,
      ) ?? null,
    [local.selectedAlternativeId, alternativeSection.details],
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
        (behavior) => behavior.replacement_title === local.directBehaviorLabel,
      ) ?? null,
    [local.directBehaviorLabel],
  );
  const selectedDirectBehaviorDescription = useMemo(() => {
    if (!selectedDirectBehavior) return "설명이 없습니다.";
    return (
      selectedDirectBehavior.description?.trim() ||
      selectedDirectBehavior.usage_description?.trim() ||
      "설명이 없습니다."
    );
  }, [selectedDirectBehavior]);
  const selectedDirectTagMetas = useMemo(
    () =>
      local.directBehaviorTags.map((tag) => {
        const meta = COGNITIVE_ERRORS.find((item) => item.title === tag);
        return {
          id: meta?.id ?? null,
          title: tag,
          description: meta?.description ?? "설명이 없습니다.",
        };
      }),
    [local.directBehaviorTags],
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
    if (flow.mode === "ai") {
      if (flow.aiStep === "suggestions") {
        flowActions.setAiStep("select-alternative");
        return;
      }
      if (flow.aiStep === "select-alternative") {
        flowActions.setAiStep("select-errors");
        return;
      }
      if (flow.aiStep === "select-errors") {
        flowActions.setAiStep("select-thought");
        return;
      }
    }
    if (flow.mode === "direct") {
      if (flow.directStep === "input") {
        flowActions.setDirectStep("select-behavior");
        return;
      }
      if (flow.directStep === "select-behavior") {
        flowActions.setDirectStep("select-tags");
        return;
      }
    }
    if (flow.mode && !forcedMode) {
      resetFlow();
      flowActions.setMode(null);
      return;
    }
    if (forcedMode) {
      router.push(`/detail/add/behavior?id=${noteId}`);
      return;
    }
    router.push(`/detail?id=${noteId}`);
  };

  const resetFlow = useCallback(() => {
    localDispatch({ type: "RESET" });
    flowActions.reset({
      mode: forcedMode ?? null,
      aiStep: "select-thought",
      directStep: "select-tags",
    });
  }, [flowActions, forcedMode]);

  const handleModeSelect = (next: AddMode) => {
    if (forcedMode) return;
    resetFlow();
    flowActions.setMode(next);
  };

  useEffect(() => {
    if (!forcedMode) return;
    resetFlow();
    flowActions.setMode(forcedMode);
  }, [flowActions, forcedMode, resetFlow]);

  const toggleError = (id: string) => {
    const result = toggleListValue(local.selectedErrorIds, id, { max: 2 });
    if (result.overflowed) {
      pushToast("인지오류는 최대 2개까지 선택할 수 있어요.", "error");
      return;
    }
    patchLocal({ selectedErrorIds: result.next });
  };

  const handleSelectThought = (id: string) => {
    patchLocal({
      selectedThoughtId: id,
      selectedErrorIds: [],
      selectedAlternativeId: "",
    });
  };

  const handleToggleError = (id: string) => {
    toggleError(id);
    patchLocal({ selectedAlternativeId: "" });
  };

  const ensureAiReady = async () => {
    if (aiLocked) {
      openAuthModal();
      return false;
    }
    const allowed = await checkUsage();
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
    flowActions.startAi();
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
      flowActions.setAiFallback(isAiFallback(suggestions));
      const next: Record<string, string> = {};
      suggestions.forEach((item) => {
        next[item.behaviorId] = item.suggestion;
      });
      patchLocal({ suggestionsById: next });
      flowActions.setAiStep("suggestions");
    } catch (aiErr) {
      console.error(aiErr);
      flowActions.setAiError("AI 제안을 불러오지 못했습니다.");
    } finally {
      flowActions.finishAi();
    }
  };

  const applySuggestion = (behaviorId: string) => {
    const candidate = behaviorCandidates.find(
      (item) => item.behavior.id === behaviorId,
    );
    if (!candidate) return;
    const suggestion = local.suggestionsById[behaviorId] ?? "";
    patchLocal({
      selectedBehaviorId: behaviorId,
      selectedBehaviorLabel: candidate.behavior.replacement_title,
      selectedBehaviorTags: candidate.tags,
      selectedBehaviorDescription: suggestion,
    });
  };

  const handleSaveAi = async () => {
    if (
      !local.selectedBehaviorLabel.trim() ||
      !local.selectedBehaviorDescription.trim()
    ) {
      pushToast("행동 반응을 선택해주세요.", "error");
      return;
    }
    if (local.savedBehaviorIds.includes(local.selectedBehaviorId)) {
      pushToast("이미 저장된 제안입니다.", "info");
      return;
    }
    flowActions.setSaving(true);
    const ok = await behaviorSection.handleAddWithValues(
      local.selectedBehaviorLabel.trim(),
      local.selectedBehaviorDescription.trim(),
      local.selectedBehaviorTags,
    );
    flowActions.setSaving(false);
    if (ok) {
      patchLocal({
        savedBehaviorIds: local.savedBehaviorIds.includes(
          local.selectedBehaviorId,
        )
          ? local.savedBehaviorIds
          : [...local.savedBehaviorIds, local.selectedBehaviorId],
      });
      pushToast("행동 반응을 저장했어요.", "success");
    }
  };

  const handleSaveDirect = async () => {
    const validation = validateUserText(local.directDescription, {
      minLength: 10,
      minLengthMessage: "행동 반응 설명을 10자 이상 입력해주세요.",
    });
    if (!validation.ok) {
      pushToast(validation.message, "error");
      return;
    }
    if (
      !local.directBehaviorLabel.trim() ||
      local.directBehaviorTags.length === 0
    ) {
      pushToast("행동 반응과 인지오류를 선택해주세요.", "error");
      return;
    }
    flowActions.setSaving(true);
    const ok = await behaviorSection.handleAddWithValues(
      local.directBehaviorLabel.trim(),
      local.directDescription.trim(),
      local.directBehaviorTags,
    );
    flowActions.setSaving(false);
    if (ok) {
      pushToast("행동 반응을 저장했어요.", "success");
      router.push(`/detail?id=${noteId}`);
    }
  };

  const isSelectedSaved = useMemo(
    () => local.savedBehaviorIds.includes(local.selectedBehaviorId),
    [local.savedBehaviorIds, local.selectedBehaviorId],
  );

  const showAiNext = flow.mode === "ai" && flow.aiStep !== "suggestions";
  const showDirectNext =
    flow.mode === "direct" &&
    (flow.directStep === "select-tags" ||
      flow.directStep === "select-behavior");
  const showAiSave = flow.mode === "ai" && flow.aiStep === "suggestions";
  const showDirectSave = flow.mode === "direct" && flow.directStep === "input";
  const saveLabel = isSelectedSaved ? "저장됨" : "저장";
  const saveIcon = isSelectedSaved ? (
    <Check size={22} />
  ) : (
    <ArrowDownToLine size={22} />
  );

  const nextDisabledAi =
    (flow.aiStep === "select-thought" && !local.selectedThoughtId) ||
    (flow.aiStep === "select-errors" && local.selectedErrorIds.length === 0) ||
    (flow.aiStep === "select-alternative" && !local.selectedAlternativeId);
  const nextDisabledDirect =
    (flow.directStep === "select-tags" &&
      local.directBehaviorTags.length === 0) ||
    (flow.directStep === "select-behavior" &&
      !local.directBehaviorLabel.trim());

  const handleAiNext = () => {
    if (flow.aiStep === "select-thought") {
      flowActions.setAiStep("select-errors");
      return;
    }
    if (flow.aiStep === "select-errors") {
      flowActions.setAiStep("select-alternative");
      return;
    }
    if (flow.aiStep === "select-alternative") {
      void handleGenerateSuggestions();
    }
  };

  const handleDirectNext = () => {
    if (flow.directStep === "select-tags") {
      if (local.directBehaviorTags.length === 0) return;
      flowActions.setDirectStep("select-behavior");
      return;
    }
    if (flow.directStep === "select-behavior") {
      if (!local.directBehaviorLabel.trim()) return;
      flowActions.setDirectStep("input");
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
            <EmotionNoteAddModeSelector
              value={flow.mode}
              onSelect={handleModeSelect}
              aiLocked={aiLocked}
              onLockedClick={() => openAuthModal()}
            />
          </div>
        ) : null}

        {flow.mode === "ai" && (
          <div className={styles.sectionStack}>
            {!flow.aiLoading && flow.aiStep === "select-thought" && (
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
                    const isSelected =
                      local.selectedThoughtId === String(detail.id);
                    const emotionLabel =
                      detail.emotion?.trim() || "감정 미선택";
                    const thoughtText = detail.automatic_thought?.trim() || "-";
                    const isExpanded = local.expandedThoughtIds.includes(
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
                            patchLocal({
                              expandedThoughtIds:
                                local.expandedThoughtIds.includes(
                                  String(detail.id),
                                )
                                  ? local.expandedThoughtIds.filter(
                                      (id) => id !== String(detail.id),
                                    )
                                  : [
                                      ...local.expandedThoughtIds,
                                      String(detail.id),
                                    ],
                            })
                          }
                        />
                      </SelectionCard>
                    );
                  })}
                </SelectionPanel>
              </div>
            )}
            {!flow.aiLoading && flow.aiStep === "select-errors" && (
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
                    const isSelected = local.selectedErrorIds.includes(
                      String(errorDetail.id),
                    );
                    const description =
                      errorDetail.error_description || "설명이 없습니다.";
                    const isExpanded = local.expandedErrorIds.includes(
                      String(errorDetail.id),
                    );
                    return (
                      <SelectionCard
                        key={errorDetail.id}
                        selected={isSelected}
                        onSelect={() =>
                          handleToggleError(String(errorDetail.id))
                        }
                      >
                        <p className={styles.sectionTitle}>
                          {errorDetail.error_label}
                        </p>
                        <ExpandableText
                          text={description}
                          expanded={isExpanded}
                          onToggle={() =>
                            patchLocal({
                              expandedErrorIds:
                                local.expandedErrorIds.includes(
                                  String(errorDetail.id),
                                )
                                  ? local.expandedErrorIds.filter(
                                      (id) => id !== String(errorDetail.id),
                                    )
                                  : [
                                      ...local.expandedErrorIds,
                                      String(errorDetail.id),
                                    ],
                            })
                          }
                        />
                      </SelectionCard>
                    );
                  })}
                </SelectionPanel>
              </div>
            )}

            {!flow.aiLoading && flow.aiStep === "select-alternative" && (
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
                      local.selectedAlternativeId === String(alternative.id);
                    const text = alternative.alternative?.trim() || "-";
                    const isExpanded = local.expandedAlternativeIds.includes(
                      String(alternative.id),
                    );
                    return (
                      <SelectionCard
                        key={alternative.id}
                        selected={isSelected}
                        onSelect={() =>
                          patchLocal({
                            selectedAlternativeId: String(alternative.id),
                          })
                        }
                      >
                        <ExpandableText
                          text={text}
                          expanded={isExpanded}
                          onToggle={() =>
                            patchLocal({
                              expandedAlternativeIds:
                                local.expandedAlternativeIds.includes(
                                  String(alternative.id),
                                )
                                  ? local.expandedAlternativeIds.filter(
                                      (id) => id !== String(alternative.id),
                                    )
                                  : [
                                      ...local.expandedAlternativeIds,
                                      String(alternative.id),
                                    ],
                            })
                          }
                        />
                      </SelectionCard>
                    );
                  })}
                </SelectionPanel>
              </div>
            )}

            {flow.aiLoading && (
              <div className={styles.stepCenter}>
                <AiLoadingCard
                  title="행동 반응 생성 중"
                  description="선택한 내용을 기반으로 행동 제안을 만들고 있어요."
                  tone="blue"
                />
              </div>
            )}

            {!flow.aiLoading && flow.aiError && (
              <div className={styles.errorBox}>{flow.aiError}</div>
            )}
            {!flow.aiLoading && flow.aiFallback && flow.aiStep === "suggestions" && (
              <AiFallbackNotice onRetry={() => void handleGenerateSuggestions()} />
            )}

            {!flow.aiLoading && flow.aiStep === "suggestions" && (
              <AiCandidatesPanel
                title="AI 행동 반응 후보"
                description="원하는 행동을 선택한 뒤 저장하세요."
                countText={`${behaviorCandidates.length}개 추천`}
                tone="blue"
              >
                <div className={styles.candidateList}>
                  {behaviorCandidates.map((candidate, index) => {
                    const suggestion =
                      local.suggestionsById[candidate.behavior.id] ?? "";
                    const isSelected =
                      local.selectedBehaviorId === candidate.behavior.id;
                    const saved = local.savedBehaviorIds.includes(
                      candidate.behavior.id,
                    );
                    return (
                      <SelectionCard
                        key={`${candidate.behavior.id}-${index}`}
                        selected={isSelected}
                        saved={saved}
                        onSelect={() => applySuggestion(candidate.behavior.id)}
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

        {flow.mode === "direct" && (
          <div className={styles.sectionStack}>
            {flow.directStep === "select-tags" && (
              <div className={styles.stepCenter}>
                <div className={styles.selectionRow}>
                  <p className={styles.sectionTitle}>
                    인지오류 선택 (최대 2개)
                  </p>
                  <ErrorTagSelector
                    values={local.directBehaviorTags}
                    maxSelected={2}
                    onToggle={(tag) => {
                      const result = toggleListValue(
                        local.directBehaviorTags,
                        tag,
                        { max: 2 },
                      );
                      patchLocal({ directBehaviorTags: result.next });
                    }}
                  />
                  <EmotionNoteAddSelectionReveal
                    isVisible={selectedDirectTagMetas.length > 0}
                  >
                    {selectedDirectTagMetas.length > 0 ? (
                      <div className={styles.revealInner}>
                        <div className={styles.summaryGrid}>
                          {selectedDirectTagMetas.map((tag) => (
                            <EmotionNoteAddSummaryItem
                              key={tag.title}
                              label={tag.title}
                              body={tag.description}
                              tone="soft"
                            />
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </EmotionNoteAddSelectionReveal>
                </div>
              </div>
            )}

            {flow.directStep === "select-behavior" && (
              <div className={styles.stepCenter}>
                <div className={styles.selectionRow}>
                  <p className={styles.sectionTitle}>행동 반응 선택</p>
                  <BehaviorOptionSelector
                    value={local.directBehaviorLabel}
                    onSelect={(value) =>
                      patchLocal({ directBehaviorLabel: value })
                    }
                    options={directBehaviorOptions}
                  />
                  <EmotionNoteAddSelectionReveal
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
                  </EmotionNoteAddSelectionReveal>
                </div>
              </div>
            )}

            {flow.directStep === "input" && (
              <>
                {(local.directBehaviorLabel.trim() ||
                  local.directBehaviorTags.length > 0) && (
                  <details className={styles.summaryBox}>
                    <summary className={styles.summaryToggle}>
                      선택한 내용 보기
                    </summary>
                    <div className={styles.summaryBody}>
                      {local.directBehaviorLabel.trim() ? (
                        <>
                          <p className={styles.summaryLabel}>행동 반응</p>
                          <div className={styles.summaryGrid}>
                            <EmotionNoteAddSummaryItem
                              label={local.directBehaviorLabel}
                              body={selectedDirectBehaviorDescription}
                            />
                          </div>
                        </>
                      ) : null}
                      {selectedDirectTagMetas.length > 0 ? (
                        <>
                          <p className={styles.summaryLabel}>인지오류</p>
                          <div className={styles.summaryGrid}>
                            {selectedDirectTagMetas.map((tag) => (
                              <EmotionNoteAddSummaryItem
                                key={tag.title}
                                label={tag.title}
                                body={tag.description}
                                tone="soft"
                              />
                            ))}
                          </div>
                        </>
                      ) : null}
                    </div>
                  </details>
                )}
                <div className={styles.inputStack}>
                  <BlinkTextarea
                    value={local.directDescription}
                    onChange={(value) =>
                      patchLocal({ directDescription: value })
                    }
                    placeholder="행동 반응 설명을 적어주세요."
                  />
                  <p className={styles.helperText}>
                    입력한 내용은 바로 이 노트에 저장됩니다.
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
          disabled={nextDisabledAi || flow.aiLoading}
          loading={flow.aiLoading}
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
              !local.selectedBehaviorLabel.trim() ||
              flow.isSaving ||
              isSelectedSaved
            }
            loading={flow.isSaving}
            className={styles.fab}
          />
          <FloatingActionButton
            label="노트로 돌아가기"
            icon={<BookSearch size={20} />}
            helperText="노트로 돌아가기"
            onClick={() => router.push(`/detail?id=${noteId}`)}
            className={styles.fabSecondary}
          />
        </>
      )}
      {showDirectSave && (
        <FloatingActionButton
          label="저장"
          icon={<ArrowDownToLine size={22} />}
          helperText="행동 반응 저장"
          onClick={() => void handleSaveDirect()}
          disabled={flow.isSaving}
          loading={flow.isSaving}
          className={styles.fab}
        />
      )}
    </EmotionNoteAddPageLayout>
  );
}
