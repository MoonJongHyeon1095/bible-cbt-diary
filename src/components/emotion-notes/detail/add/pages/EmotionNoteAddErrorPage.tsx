"use client";

import { useCbtToast } from "@/components/session/common/CbtToast";
import { validateUserText } from "@/components/session/utils/validation";
import AiFallbackNotice from "@/components/common/AiFallbackNotice";
import FloatingActionButton from "@/components/common/FloatingActionButton";
import { useAuthModal } from "@/components/header/AuthModalProvider";
import BlinkTextarea from "@/components/ui/BlinkTextarea";
import { analyzeCognitiveErrorDetails } from "@/lib/ai";
import { COGNITIVE_ERRORS } from "@/lib/constants/errors";
import { useAiUsageGuard } from "@/lib/hooks/useAiUsageGuard";
import { isAiFallback } from "@/lib/utils/aiFallback";
import {
  AlertCircle,
  ArrowDownToLine,
  ArrowRight,
  BookSearch,
  Check,
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
import EmotionNoteAddModeSelector, {
  AddMode,
} from "./EmotionNoteAddModeSelector";
import { ErrorOptionSelector } from "./EmotionNoteAddOptionSelectors";
import styles from "./EmotionNoteAddPage.module.css";
import EmotionNoteAddPageLayout from "./EmotionNoteAddPageLayout";
import EmotionNoteAddSelectionReveal from "./EmotionNoteAddSelectionReveal";
import EmotionNoteAddSummaryItem from "./EmotionNoteAddSummaryItem";

type EmotionNoteAddErrorPageProps = {
  noteId: number;
  mode?: AddMode;
};

type LocalState = {
  errorLabel: string;
  directDescription: string;
  selectedThoughtId: string;
  expandedThoughtIds: string[];
  aiSuggestion: string;
  selectedSuggestion: string;
  savedSuggestions: string[];
};

type LocalAction =
  | { type: "PATCH"; patch: Partial<LocalState> }
  | { type: "RESET" };

const initialLocalState: LocalState = {
  errorLabel: "",
  directDescription: "",
  selectedThoughtId: "",
  expandedThoughtIds: [],
  aiSuggestion: "",
  selectedSuggestion: "",
  savedSuggestions: [],
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

export default function EmotionNoteAddErrorPage({
  noteId,
  mode: forcedMode,
}: EmotionNoteAddErrorPageProps) {
  const router = useRouter();
  const { pushToast } = useCbtToast();
  const { openAuthModal } = useAuthModal();
  const { checkUsage } = useAiUsageGuard({
    enabled: false,
    cache: true,
    redirectTo: null,
  });
  const { accessMode, triggerText, error, thoughtSection, errorSection } =
    useEmotionNoteDetail(noteId);
  const aiLocked = accessMode !== "auth";

  const [local, localDispatch] = useReducer(localReducer, initialLocalState);
  const patchLocal = useCallback(
    (patch: Partial<LocalState>) =>
      localDispatch({ type: "PATCH", patch }),
    [],
  );
  const { state: flow, actions: flowActions } = useAddFlow({
    initialMode: forcedMode ?? null,
    initialAiStep: "select-error",
    initialDirectStep: "select-error",
  });
  const lastErrorRef = useRef<string | null>(null);
  const selectedErrorMeta = useMemo(
    () =>
      COGNITIVE_ERRORS.find((item) => item.title === local.errorLabel) ?? null,
    [local.errorLabel],
  );

  useEffect(() => {
    if (error && error !== lastErrorRef.current) {
      pushToast(error, "error");
      lastErrorRef.current = error;
    }
  }, [error, pushToast]);

  useEffect(() => {
    patchLocal({ aiSuggestion: "", selectedSuggestion: "" });
    flowActions.setAiError(null);
    flowActions.setAiFallback(false);
    patchLocal({ savedSuggestions: [] });
  }, [flowActions, local.errorLabel, local.selectedThoughtId, patchLocal]);

  const selectedThought = useMemo(
    () =>
      thoughtSection.details.find(
        (detail) => String(detail.id) === local.selectedThoughtId,
      ) ?? null,
    [local.selectedThoughtId, thoughtSection.details],
  );

  const handleClose = () => {
    if (flow.mode === "ai") {
      if (flow.aiStep === "suggestions") {
        flowActions.setAiStep("select-thought");
        return;
      }
      if (flow.aiStep === "select-thought") {
        flowActions.setAiStep("select-error");
        return;
      }
    }
    if (flow.mode === "direct") {
      if (flow.directStep === "input") {
        flowActions.setDirectStep("select-error");
        return;
      }
    }
    if (flow.mode && !forcedMode) {
      resetFlow();
      flowActions.setMode(null);
      return;
    }
    if (forcedMode) {
      router.push(`/detail/add/error?id=${noteId}`);
      return;
    }
    router.push(`/detail?id=${noteId}`);
  };

  const resetFlow = useCallback(() => {
    localDispatch({ type: "RESET" });
    flowActions.reset({
      mode: forcedMode ?? null,
      aiStep: "select-error",
      directStep: "select-error",
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
    if (!local.errorLabel.trim()) {
      pushToast("인지오류를 먼저 선택해주세요.", "error");
      return false;
    }
    if (!selectedThought) {
      pushToast("자동사고를 먼저 선택해주세요.", "error");
      return false;
    }
    return true;
  };

  const handleGenerateSuggestion = async () => {
    const ready = await ensureAiReady();
    if (!ready || !selectedThought) return;
    const meta = COGNITIVE_ERRORS.find(
      (error) => error.title === local.errorLabel,
    );
    if (!meta) {
      pushToast("인지오류 정보를 찾을 수 없습니다.", "error");
      return;
    }
    flowActions.startAi();
    patchLocal({ aiSuggestion: "" });
    try {
      const result = await analyzeCognitiveErrorDetails(
        triggerText,
        selectedThought.automatic_thought,
        [meta.index],
        { noteProposal: true },
      );
      flowActions.setAiFallback(isAiFallback(result));
      const analysis = result.errors[0]?.analysis ?? "";
      if (!analysis.trim()) {
        throw new Error("인지오류 설명이 없습니다.");
      }
      patchLocal({ aiSuggestion: analysis, selectedSuggestion: analysis });
      flowActions.setAiStep("suggestions");
    } catch (aiErr) {
      console.error(aiErr);
      flowActions.setAiError("AI 제안을 불러오지 못했습니다.");
    } finally {
      flowActions.finishAi();
    }
  };

  const handleSaveAi = async () => {
    if (!local.errorLabel.trim() || !local.selectedSuggestion.trim()) {
      pushToast("인지오류 제안을 선택해주세요.", "error");
      return;
    }
    if (isSelectedSaved) {
      pushToast("이미 저장된 제안입니다.", "info");
      return;
    }
    flowActions.setSaving(true);
    const ok = await errorSection.handleAddWithValues(
      local.errorLabel.trim(),
      local.selectedSuggestion.trim(),
    );
    flowActions.setSaving(false);
    if (ok) {
      patchLocal({
        savedSuggestions: local.savedSuggestions.includes(
          local.selectedSuggestion,
        )
          ? local.savedSuggestions
          : [...local.savedSuggestions, local.selectedSuggestion],
      });
      pushToast("인지오류를 저장했어요.", "success");
    }
  };

  const handleSaveDirect = async () => {
    const validation = validateUserText(local.directDescription, {
      minLength: 10,
      minLengthMessage: "인지오류 설명을 10자 이상 입력해주세요.",
    });
    if (!validation.ok) {
      pushToast(validation.message, "error");
      return;
    }
    if (!local.errorLabel.trim()) {
      pushToast("인지오류를 선택해주세요.", "error");
      return;
    }
    flowActions.setSaving(true);
    const ok = await errorSection.handleAddWithValues(
      local.errorLabel.trim(),
      local.directDescription.trim(),
    );
    flowActions.setSaving(false);
    if (ok) {
      pushToast("인지오류를 저장했어요.", "success");
      router.push(`/detail?id=${noteId}`);
    }
  };

  const isSelectedSaved = useMemo(
    () => local.savedSuggestions.includes(local.selectedSuggestion),
    [local.savedSuggestions, local.selectedSuggestion],
  );

  const showAiNext = flow.mode === "ai" && flow.aiStep !== "suggestions";
  const showDirectNext =
    flow.mode === "direct" && flow.directStep === "select-error";
  const showAiSave = flow.mode === "ai" && flow.aiStep === "suggestions";
  const showDirectSave = flow.mode === "direct" && flow.directStep === "input";
  const saveLabel = isSelectedSaved ? "저장됨" : "저장";
  const saveIcon = isSelectedSaved ? (
    <Check size={22} />
  ) : (
    <ArrowDownToLine size={22} />
  );

  const nextDisabledAi =
    (flow.aiStep === "select-error" && !local.errorLabel.trim()) ||
    (flow.aiStep === "select-thought" && !local.selectedThoughtId);

  const handleAiNext = () => {
    if (flow.aiStep === "select-error") {
      if (!local.errorLabel.trim()) return;
      flowActions.setAiStep("select-thought");
      return;
    }
    if (flow.aiStep === "select-thought") {
      if (!local.selectedThoughtId) return;
      void handleGenerateSuggestion();
    }
  };

  return (
    <EmotionNoteAddPageLayout
      title="인지오류 추가"
      tone="rose"
      icon={AlertCircle}
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
            {flow.aiLoading ? (
              <div className={styles.stepCenter}>
                <AiLoadingCard
                  title="인지오류 설명 생성 중"
                  description="선택한 자동사고를 분석하고 있어요."
                  tone="rose"
                />
              </div>
            ) : (
              <>
                {flow.aiStep === "select-error" && (
                  <div className={styles.selectionRow}>
                    <p className={styles.sectionTitle}>인지오류 선택</p>
                    <p className={styles.sectionHint}>
                      인지오류를 먼저 선택해야 합니다.
                    </p>
                    <ErrorOptionSelector
                      value={local.errorLabel}
                      onSelect={(next) => {
                        patchLocal({
                          errorLabel: next,
                          selectedSuggestion: "",
                        });
                      }}
                    />
                    <EmotionNoteAddSelectionReveal
                      isVisible={Boolean(selectedErrorMeta)}
                    >
                      {selectedErrorMeta ? (
                        <div className={styles.revealInner}>
                          <p className={styles.revealTitle}>
                            {selectedErrorMeta.title}
                          </p>
                          <p className={styles.revealText}>
                            {selectedErrorMeta.description}
                          </p>
                        </div>
                      ) : null}
                    </EmotionNoteAddSelectionReveal>
                  </div>
                )}

                {flow.aiStep === "select-thought" && (
                  <div className={styles.stepCenter}>
                    <SelectionPanel
                      title="자동사고 선택"
                      description="선택한 자동사고를 기준으로 인지오류 설명을 생성합니다."
                      countText={`${thoughtSection.details.length}개`}
                      emptyText={
                        thoughtSection.details.length === 0
                          ? "아직 자동사고가 없습니다. 먼저 자동사고를 추가해주세요."
                          : undefined
                      }
                      tone="rose"
                    >
                      {thoughtSection.details.map((detail) => {
                        const isSelected =
                          local.selectedThoughtId === String(detail.id);
                        const emotionLabel =
                          detail.emotion?.trim() || "감정 미선택";
                        const thoughtText =
                          detail.automatic_thought?.trim() || "-";
                        const isExpanded = local.expandedThoughtIds.includes(
                          String(detail.id),
                        );
                        return (
                          <SelectionCard
                            key={detail.id}
                            selected={isSelected}
                            onSelect={() =>
                              patchLocal({
                                selectedThoughtId: String(detail.id),
                              })
                            }
                            tone="rose"
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
                                tone="rose"
                              />
                          </SelectionCard>
                        );
                      })}
                    </SelectionPanel>
                  </div>
                )}

                {flow.aiError && (
                  <div className={styles.errorBox}>{flow.aiError}</div>
                )}
                {flow.aiFallback && flow.aiStep === "suggestions" && (
                  <AiFallbackNotice onRetry={() => void handleGenerateSuggestion()} />
                )}

                {flow.aiStep === "suggestions" && local.aiSuggestion && (
                  <AiCandidatesPanel
                    title="AI 인지오류 제안"
                    description="선택한 제안을 저장하세요."
                    tone="rose"
                  >
                    <SelectionCard
                      selected={Boolean(local.selectedSuggestion.trim())}
                      saved={local.savedSuggestions.includes(local.aiSuggestion)}
                      onSelect={() =>
                        patchLocal({ selectedSuggestion: local.aiSuggestion })
                      }
                      tone="rose"
                    >
                      {local.aiSuggestion}
                    </SelectionCard>
                  </AiCandidatesPanel>
                )}
              </>
            )}
          </div>
        )}

        {flow.mode === "direct" && (
          <div className={styles.sectionStack}>
            {flow.directStep === "select-error" && (
              <div className={styles.selectionRow}>
                <p className={styles.sectionTitle}>인지오류 선택</p>
                <p className={styles.sectionHint}>
                  선택한 인지오류는 설명과 함께 저장됩니다.
                </p>
                <ErrorOptionSelector
                  value={local.errorLabel}
                  onSelect={(value) => patchLocal({ errorLabel: value })}
                />
                <EmotionNoteAddSelectionReveal
                  isVisible={Boolean(selectedErrorMeta)}
                >
                  {selectedErrorMeta ? (
                    <div className={styles.revealInner}>
                      <p className={styles.revealTitle}>
                        {selectedErrorMeta.title}
                      </p>
                      <p className={styles.revealText}>
                        {selectedErrorMeta.description}
                      </p>
                    </div>
                  ) : null}
                </EmotionNoteAddSelectionReveal>
              </div>
            )}

            {flow.directStep === "input" && (
              <>
                {local.errorLabel.trim() && (
                  <details className={styles.summaryBox}>
                    <summary className={styles.summaryToggle}>
                      <span className={styles.summaryToggleContent}>
                        <span className={styles.summaryToggleLabel}>
                          선택한 인지오류 보기
                        </span>
                        <span className={styles.selectedChip}>
                          {local.errorLabel}
                        </span>
                      </span>
                    </summary>
                    <div className={styles.summaryBody}>
                      <div className={styles.summaryGrid}>
                        <EmotionNoteAddSummaryItem
                          label={local.errorLabel}
                          body={
                            selectedErrorMeta?.description || "설명이 없습니다."
                          }
                        />
                      </div>
                    </div>
                  </details>
                )}
                <div className={styles.inputStack}>
                  <BlinkTextarea
                    value={local.directDescription}
                    onChange={(value) =>
                      patchLocal({ directDescription: value })
                    }
                    placeholder="인지오류 설명을 적어주세요."
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
          onClick={() => flowActions.setDirectStep("input")}
          disabled={!local.errorLabel.trim()}
          className={styles.fab}
        />
      )}
      {showAiSave && (
        <>
          <FloatingActionButton
            label={saveLabel}
            icon={saveIcon}
            helperText="인지오류 저장"
            onClick={() => void handleSaveAi()}
            disabled={
              !local.selectedSuggestion.trim() ||
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
          helperText="인지오류 저장"
          onClick={() => void handleSaveDirect()}
          disabled={flow.isSaving}
          loading={flow.isSaving}
          className={styles.fab}
        />
      )}
    </EmotionNoteAddPageLayout>
  );
}
