"use client";

import { useCbtToast } from "@/components/session/common/CbtToast";
import { validateUserText } from "@/components/session/utils/validation";
import AiFallbackNotice from "@/components/common/AiFallbackNotice";
import FloatingActionButton from "@/components/common/FloatingActionButton";
import { useAuthModal } from "@/components/header/AuthModalProvider";
import BlinkTextarea from "@/components/ui/BlinkTextarea";
import { generateContextualAlternativeThoughts } from "@/lib/ai";
import { useAiUsageGuard } from "@/lib/hooks/useAiUsageGuard";
import { isAiFallback } from "@/lib/utils/aiFallback";
import {
  ArrowDownToLine,
  ArrowRight,
  BookSearch,
  Check,
  Lightbulb,
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
import styles from "./EmotionNoteAddPage.module.css";
import EmotionNoteAddPageLayout from "./EmotionNoteAddPageLayout";
import EmotionNoteAddSummaryItem from "./EmotionNoteAddSummaryItem";

type AlternativeCandidate = {
  thought: string;
  technique: string;
  techniqueDescription: string;
};

type LocalState = {
  selectedThoughtId: string;
  selectedErrorIds: string[];
  expandedThoughtIds: string[];
  expandedErrorIds: string[];
  aiCandidates: AlternativeCandidate[];
  selectedCandidate: string;
  savedCandidates: string[];
  directText: string;
};

type LocalAction =
  | { type: "PATCH"; patch: Partial<LocalState> }
  | { type: "RESET" };

const initialLocalState: LocalState = {
  selectedThoughtId: "",
  selectedErrorIds: [],
  expandedThoughtIds: [],
  expandedErrorIds: [],
  aiCandidates: [],
  selectedCandidate: "",
  savedCandidates: [],
  directText: "",
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

type EmotionNoteAddAlternativePageProps = {
  noteId: number;
  mode?: AddMode;
};

export default function EmotionNoteAddAlternativePage({
  noteId,
  mode: forcedMode,
}: EmotionNoteAddAlternativePageProps) {
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
    initialDirectStep: "select-thought",
  });
  const lastErrorRef = useRef<string | null>(null);

  useEffect(() => {
    if (error && error !== lastErrorRef.current) {
      pushToast(error, "error");
      lastErrorRef.current = error;
    }
  }, [error, pushToast]);

  useEffect(() => {
    patchLocal({ aiCandidates: [], selectedCandidate: "", savedCandidates: [] });
    flowActions.setAiError(null);
    flowActions.setAiFallback(false);
  }, [flowActions, local.selectedThoughtId, local.selectedErrorIds, patchLocal]);

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

  const handleClose = () => {
    if (flow.mode === "ai") {
      if (flow.aiStep === "suggestions") {
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
        flowActions.setDirectStep("select-errors");
        return;
      }
      if (flow.directStep === "select-errors") {
        flowActions.setDirectStep("select-thought");
        return;
      }
    }
    if (flow.mode && !forcedMode) {
      resetFlow();
      flowActions.setMode(null);
      return;
    }
    if (forcedMode) {
      router.push(`/detail/add/alternative?id=${noteId}`);
      return;
    }
    router.push(`/detail?id=${noteId}`);
  };

  const resetFlow = useCallback(() => {
    localDispatch({ type: "RESET" });
    flowActions.reset({
      mode: forcedMode ?? null,
      aiStep: "select-thought",
      directStep: "select-thought",
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
    patchLocal({ selectedThoughtId: id, selectedErrorIds: [] });
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
    if (!selectedThought) {
      pushToast("자동사고를 먼저 선택해주세요.", "error");
      return false;
    }
    if (selectedErrors.length === 0) {
      pushToast("인지오류를 1~2개 선택해주세요.", "error");
      return false;
    }
    return true;
  };

  const handleGenerateCandidates = async () => {
    const ready = await ensureAiReady();
    if (!ready || !selectedThought) return;
    flowActions.startAi();
    patchLocal({ aiCandidates: [] });
    try {
      const result = await generateContextualAlternativeThoughts(
        triggerText,
        selectedThought.emotion,
        selectedThought.automatic_thought,
        selectedErrors.map((errorDetail) => ({
          title: errorDetail.error_label,
          detail: errorDetail.error_description,
        })),
        { noteProposal: true },
      );
      flowActions.setAiFallback(isAiFallback(result));
      patchLocal({ aiCandidates: result });
      flowActions.setAiStep("suggestions");
    } catch (aiErr) {
      console.error(aiErr);
      flowActions.setAiError("AI 제안을 불러오지 못했습니다.");
    } finally {
      flowActions.finishAi();
    }
  };

  const handleSaveAi = async () => {
    if (!local.selectedCandidate.trim()) {
      pushToast("대안사고를 선택해주세요.", "error");
      return;
    }
    if (local.savedCandidates.includes(local.selectedCandidate)) {
      pushToast("이미 저장된 제안입니다.", "info");
      return;
    }
    flowActions.setSaving(true);
    const ok = await alternativeSection.handleAddWithValues(
      local.selectedCandidate.trim(),
    );
    flowActions.setSaving(false);
    if (ok) {
      patchLocal({
        savedCandidates: local.savedCandidates.includes(local.selectedCandidate)
          ? local.savedCandidates
          : [...local.savedCandidates, local.selectedCandidate],
      });
      pushToast("대안사고를 저장했어요.", "success");
    }
  };

  const handleSaveDirect = async () => {
    const validation = validateUserText(local.directText, {
      minLength: 10,
      minLengthMessage: "대안사고를 10자 이상 입력해주세요.",
    });
    if (!validation.ok) {
      pushToast(validation.message, "error");
      return;
    }
    if (!selectedThought || selectedErrors.length === 0) {
      pushToast("자동사고와 인지오류를 먼저 선택해주세요.", "error");
      return;
    }
    flowActions.setSaving(true);
    const ok = await alternativeSection.handleAddWithValues(
      local.directText.trim(),
    );
    flowActions.setSaving(false);
    if (ok) {
      pushToast("대안사고를 저장했어요.", "success");
      router.push(`/detail?id=${noteId}`);
    }
  };

  const isSelectedSaved = useMemo(
    () => local.savedCandidates.includes(local.selectedCandidate),
    [local.savedCandidates, local.selectedCandidate],
  );

  const showAiNext = flow.mode === "ai" && flow.aiStep !== "suggestions";
  const showDirectNext = flow.mode === "direct" && flow.directStep !== "input";
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
    (flow.aiStep === "select-errors" && local.selectedErrorIds.length === 0);

  const nextDisabledDirect =
    (flow.directStep === "select-thought" && !local.selectedThoughtId) ||
    (flow.directStep === "select-errors" && local.selectedErrorIds.length === 0);

  const handleAiNext = () => {
    if (flow.aiStep === "select-thought") {
      flowActions.setAiStep("select-errors");
      return;
    }
    if (flow.aiStep === "select-errors") {
      void handleGenerateCandidates();
    }
  };

  const handleDirectNext = () => {
    if (flow.directStep === "select-thought") {
      flowActions.setDirectStep("select-errors");
      return;
    }
    if (flow.directStep === "select-errors") {
      flowActions.setDirectStep("input");
    }
  };

  const formatErrorLabel = (label?: string) => {
    const trimmed = label?.trim() || "인지오류";
    return trimmed.length > 24 ? `${trimmed.slice(0, 24)}…` : trimmed;
  };

  return (
    <EmotionNoteAddPageLayout
      title="대안적 접근 추가"
      tone="green"
      icon={Lightbulb}
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
                  description="대안사고를 만들 기준 자동사고를 골라주세요."
                  countText={`${thoughtSection.details.length}개`}
                  emptyText={
                    thoughtSection.details.length === 0
                      ? "아직 자동사고가 없습니다. 먼저 자동사고를 추가해주세요."
                      : undefined
                  }
                  tone="green"
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
                        tone="green"
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
                          tone="green"
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
                  description="1~2개를 선택한 뒤 다음을 눌러주세요."
                  countText={`${errorSection.details.length}개`}
                  emptyText={
                    errorSection.details.length === 0
                      ? "아직 인지오류가 없습니다. 먼저 인지오류를 추가해주세요."
                      : undefined
                  }
                  tone="green"
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
                        onSelect={() => toggleError(String(errorDetail.id))}
                        tone="green"
                      >
                        <p className={styles.sectionTitle}>
                          {formatErrorLabel(errorDetail.error_label)}
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
                          tone="green"
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
                  title="대안사고 생성 중"
                  description="선택한 자동사고와 인지오류를 반영하고 있어요."
                  tone="green"
                />
              </div>
            )}

            {!flow.aiLoading && flow.aiError && (
              <div className={styles.errorBox}>{flow.aiError}</div>
            )}
            {!flow.aiLoading && flow.aiFallback && flow.aiStep === "suggestions" && (
              <AiFallbackNotice onRetry={() => void handleGenerateCandidates()} />
            )}

            {!flow.aiLoading && flow.aiStep === "suggestions" && (
              <AiCandidatesPanel
                title="AI 대안사고 후보"
                description="원하는 제안을 선택한 뒤 저장하세요."
                countText={`${local.aiCandidates.length}개 추천`}
                tone="green"
              >
                <div className={styles.candidateList}>
                  {local.aiCandidates.map((candidate, index) => {
                    const isSelected =
                      local.selectedCandidate.trim() ===
                      candidate.thought.trim();
                    const saved = local.savedCandidates.includes(
                      candidate.thought,
                    );
                    return (
                      <SelectionCard
                        key={`${candidate.thought}-${index}`}
                        selected={isSelected}
                        saved={saved}
                        onSelect={() =>
                          patchLocal({ selectedCandidate: candidate.thought })
                        }
                        tone="green"
                      >
                        <p className={styles.sectionTitle}>
                          {candidate.thought}
                        </p>
                        <p className={styles.sectionHint}>
                          {candidate.technique}
                        </p>
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
            {flow.directStep === "select-thought" && (
              <div className={styles.stepCenter}>
                <SelectionPanel
                  title="자동사고 선택"
                  description="대안사고를 적기 전 자동사고를 골라주세요."
                  countText={`${thoughtSection.details.length}개`}
                  emptyText={
                    thoughtSection.details.length === 0
                      ? "아직 자동사고가 없습니다. 먼저 자동사고를 추가해주세요."
                      : undefined
                  }
                  tone="green"
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
                        tone="green"
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
                          tone="green"
                        />
                      </SelectionCard>
                    );
                  })}
                </SelectionPanel>
              </div>
            )}
            {flow.directStep === "select-errors" && (
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
                  tone="green"
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
                        onSelect={() => toggleError(String(errorDetail.id))}
                        tone="green"
                      >
                        <p className={styles.sectionTitle}>
                          {formatErrorLabel(errorDetail.error_label)}
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
                          tone="green"
                        />
                      </SelectionCard>
                    );
                  })}
                </SelectionPanel>
              </div>
            )}

            {flow.directStep === "input" && (
              <>
                {(selectedThought || selectedErrors.length > 0) && (
                  <details className={styles.summaryBox}>
                    <summary className={styles.summaryToggle}>
                      선택한 내용 보기
                    </summary>
                    <div className={styles.summaryBody}>
                      {selectedThought ? (
                        <>
                          <p className={styles.summaryLabel}>자동사고</p>
                          <div className={styles.summaryGrid}>
                            <EmotionNoteAddSummaryItem
                              label={
                                selectedThought.emotion?.trim() || "감정 미선택"
                              }
                              body={
                                selectedThought.automatic_thought?.trim() || "-"
                              }
                            />
                          </div>
                        </>
                      ) : null}
                      {selectedErrors.length > 0 ? (
                        <>
                          <p className={styles.summaryLabel}>인지오류</p>
                          <div className={styles.summaryGrid}>
                            {selectedErrors.map((errorDetail) => (
                              <EmotionNoteAddSummaryItem
                                key={errorDetail.id}
                                label={formatErrorLabel(
                                  errorDetail.error_label,
                                )}
                                body={
                                  errorDetail.error_description ||
                                  "설명이 없습니다."
                                }
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
                    value={local.directText}
                    onChange={(value) => patchLocal({ directText: value })}
                    placeholder="대안적 사고를 적어주세요."
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
            helperText="대안사고 저장"
            onClick={() => void handleSaveAi()}
            disabled={
              !local.selectedCandidate.trim() ||
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
          helperText="대안사고 저장"
          onClick={() => void handleSaveDirect()}
          disabled={flow.isSaving}
          loading={flow.isSaving}
          className={styles.fab}
        />
      )}
    </EmotionNoteAddPageLayout>
  );
}
