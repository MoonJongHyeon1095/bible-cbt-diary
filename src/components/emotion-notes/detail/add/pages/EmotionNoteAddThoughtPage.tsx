"use client";

import { useCbtToast } from "@/components/session/common/CbtToast";
import { validateUserText } from "@/components/session/utils/validation";
import AiFallbackNotice from "@/components/common/AiFallbackNotice";
import FloatingActionButton from "@/components/common/FloatingActionButton";
import { useAuthModal } from "@/components/header/AuthModalProvider";
import BlinkTextarea from "@/components/ui/BlinkTextarea";
import { generateExtendedAutomaticThoughts } from "@/lib/ai";
import { EMOTIONS } from "@/lib/constants/emotions";
import { useAiUsageGuard } from "@/lib/hooks/useAiUsageGuard";
import { isAiFallback } from "@/lib/utils/aiFallback";
import {
  ArrowDownToLine,
  ArrowRight,
  BookSearch,
  Brain,
  Check,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import useEmotionNoteDetail from "../../hooks/useEmotionNoteDetail";
import { AiCandidatesPanel } from "../common/AiCandidatesPanel";
import { AiLoadingCard } from "../common/AiLoadingCard";
import { SelectionCard } from "../common/SelectionCard";
import { useAddFlow } from "../common/useAddFlow";
import EmotionNoteAddModeSelector, {
  AddMode,
} from "./EmotionNoteAddModeSelector";
import { EmotionOptionSelector } from "./EmotionNoteAddOptionSelectors";
import styles from "./EmotionNoteAddPage.module.css";
import EmotionNoteAddPageLayout from "./EmotionNoteAddPageLayout";
import EmotionNoteAddSelectionReveal from "./EmotionNoteAddSelectionReveal";

type ThoughtCandidate = {
  belief: string;
  emotionReason: string;
};

type LocalState = {
  selectedEmotion: string;
  directThought: string;
  aiCandidates: ThoughtCandidate[];
  selectedCandidate: string;
  savedCandidates: string[];
};

type LocalAction =
  | { type: "PATCH"; patch: Partial<LocalState> }
  | { type: "RESET" };

const initialLocalState: LocalState = {
  selectedEmotion: "",
  directThought: "",
  aiCandidates: [],
  selectedCandidate: "",
  savedCandidates: [],
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

type EmotionNoteAddThoughtPageProps = {
  noteId: number;
  mode?: AddMode;
};

export default function EmotionNoteAddThoughtPage({
  noteId,
  mode: forcedMode,
}: EmotionNoteAddThoughtPageProps) {
  const router = useRouter();
  const { pushToast } = useCbtToast();
  const { openAuthModal } = useAuthModal();
  const { checkUsage } = useAiUsageGuard({
    enabled: false,
    cache: true,
    redirectTo: null,
  });
  const { accessMode, triggerText, error, thoughtSection } =
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
    initialAiStep: "select-emotion",
    initialDirectStep: "select-emotion",
  });
  const lastErrorRef = useRef<string | null>(null);
  const selectedEmotionMeta = useMemo(
    () => EMOTIONS.find((item) => item.label === local.selectedEmotion) ?? null,
    [local.selectedEmotion],
  );

  useEffect(() => {
    if (error && error !== lastErrorRef.current) {
      pushToast(error, "error");
      lastErrorRef.current = error;
    }
  }, [error, pushToast]);

  const isSelectedSaved = useMemo(
    () => local.savedCandidates.includes(local.selectedCandidate),
    [local.savedCandidates, local.selectedCandidate],
  );

  const canSaveAi = useMemo(
    () =>
      Boolean(
        local.selectedEmotion.trim() &&
          local.selectedCandidate.trim() &&
          !isSelectedSaved,
      ),
    [local.selectedCandidate, local.selectedEmotion, isSelectedSaved],
  );

  const handleClose = () => {
    if (flow.mode === "ai") {
      if (flow.aiStep === "suggestions") {
        flowActions.setAiStep("select-emotion");
        return;
      }
    }
    if (flow.mode === "direct") {
      if (flow.directStep === "input") {
        flowActions.setDirectStep("select-emotion");
        return;
      }
    }
    if (flow.mode && !forcedMode) {
      resetFlow();
      flowActions.setMode(null);
      return;
    }
    if (forcedMode) {
      router.push(`/detail/add/thought?id=${noteId}`);
      return;
    }
    router.push(`/detail?id=${noteId}`);
  };

  const resetFlow = useCallback(() => {
    localDispatch({ type: "RESET" });
    flowActions.setAiError(null);
    flowActions.setAiFallback(false);
    flowActions.reset({
      mode: forcedMode ?? null,
      aiStep: "select-emotion",
      directStep: "select-emotion",
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
    if (!local.selectedEmotion.trim()) {
      pushToast("감정을 먼저 선택해주세요.", "error");
      return false;
    }
    return true;
  };

  const handleGenerateCandidates = async () => {
    const ready = await ensureAiReady();
    if (!ready) return;
    flowActions.startAi();
    patchLocal({ aiCandidates: [] });
    try {
      const result = await generateExtendedAutomaticThoughts(
        triggerText,
        local.selectedEmotion,
        { noteProposal: true },
      );
      flowActions.setAiFallback(isAiFallback(result));
      const candidates = result.sdtThoughts.map((item) => ({
        belief: item.belief,
        emotionReason: item.emotionReason,
      }));
      patchLocal({ aiCandidates: candidates });
      flowActions.setAiStep("suggestions");
    } catch (aiErr) {
      console.error(aiErr);
      flowActions.setAiError("AI 제안을 불러오지 못했습니다.");
    } finally {
      flowActions.finishAi();
    }
  };

  const handleSaveAi = async () => {
    if (isSelectedSaved) {
      pushToast("이미 저장된 제안입니다.", "info");
      return;
    }
    if (!canSaveAi) {
      pushToast("자동사고를 선택해주세요.", "error");
      return;
    }
    flowActions.setSaving(true);
    const ok = await thoughtSection.handleAddWithValues(
      local.selectedCandidate.trim(),
      local.selectedEmotion.trim(),
    );
    flowActions.setSaving(false);
    if (ok) {
      patchLocal({
        savedCandidates: local.savedCandidates.includes(local.selectedCandidate)
          ? local.savedCandidates
          : [...local.savedCandidates, local.selectedCandidate],
      });
      pushToast("자동사고를 저장했어요.", "success");
    }
  };

  const handleSaveDirect = async () => {
    const validation = validateUserText(local.directThought, {
      minLength: 10,
      minLengthMessage: "자동사고를 10자 이상 입력해주세요.",
    });
    if (!validation.ok) {
      pushToast(validation.message, "error");
      return;
    }
    if (!local.selectedEmotion.trim()) {
      pushToast("감정을 선택해주세요.", "error");
      return;
    }
    flowActions.setSaving(true);
    const ok = await thoughtSection.handleAddWithValues(
      local.directThought.trim(),
      local.selectedEmotion.trim(),
    );
    flowActions.setSaving(false);
    if (ok) {
      pushToast("자동사고를 저장했어요.", "success");
      router.push(`/detail?id=${noteId}`);
    }
  };

  const showAiNext = flow.mode === "ai" && flow.aiStep === "select-emotion";
  const showDirectNext =
    flow.mode === "direct" && flow.directStep === "select-emotion";
  const showAiSave = flow.mode === "ai" && flow.aiStep === "suggestions";
  const showDirectSave = flow.mode === "direct" && flow.directStep === "input";
  const saveLabel = isSelectedSaved ? "저장됨" : "저장";
  const saveIcon = isSelectedSaved ? (
    <Check size={22} />
  ) : (
    <ArrowDownToLine size={22} />
  );

  return (
    <EmotionNoteAddPageLayout
      title="배후의 자동 사고 추가"
      tone="amber"
      icon={Brain}
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
                  title="자동사고 생성 중"
                  description="선택한 감정을 바탕으로 후보를 만들고 있어요."
                  tone="amber"
                />
              </div>
            ) : (
              <>
                {flow.aiStep === "select-emotion" && (
                  <div className={styles.selectionRow}>
                    <p className={styles.sectionTitle}>감정 선택</p>
                    <p className={styles.sectionHint}>
                      감정을 먼저 선택해야 AI 제안을 받을 수 있어요.
                    </p>
                    <EmotionOptionSelector
                      value={local.selectedEmotion}
                      onSelect={(next) => {
                        patchLocal({
                          selectedEmotion: next,
                          selectedCandidate: "",
                          aiCandidates: [],
                          savedCandidates: [],
                        });
                        flowActions.setAiError(null);
                        flowActions.setAiStep("select-emotion");
                      }}
                    />
                  </div>
                )}

                {flow.aiStep === "select-emotion" && (
                  <EmotionNoteAddSelectionReveal
                    isVisible={Boolean(selectedEmotionMeta)}
                  >
                    {selectedEmotionMeta ? (
                      <div className={styles.revealInner}>
                        <p className={styles.revealTitle}>
                          {selectedEmotionMeta.description}
                        </p>
                        <p className={styles.revealText}>
                          {selectedEmotionMeta.physical}
                        </p>
                        <div className={styles.revealList}>
                          {selectedEmotionMeta.positive.map((item, index) => (
                            <div
                              key={`${selectedEmotionMeta.id}-positive-${index}`}
                              className={styles.revealListItem}
                            >
                              <span>•</span>
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </EmotionNoteAddSelectionReveal>
                )}

                {flow.aiError && (
                  <div className={styles.errorBox}>{flow.aiError}</div>
                )}
                {flow.aiFallback && flow.aiStep === "suggestions" && (
                  <AiFallbackNotice onRetry={() => void handleGenerateCandidates()} />
                )}

                {flow.aiStep === "suggestions" && (
                  <AiCandidatesPanel
                    title="AI 자동사고 후보"
                    description="원하는 제안을 선택한 뒤 저장하세요."
                    countText={`${local.aiCandidates.length}개 추천`}
                    tone="amber"
                  >
                    <div className={styles.candidateList}>
                      {local.aiCandidates.map((candidate, index) => {
                        const isSelected =
                          local.selectedCandidate.trim() ===
                          candidate.belief.trim();
                        const saved = local.savedCandidates.includes(
                          candidate.belief,
                        );
                        return (
                          <SelectionCard
                            key={`${candidate.belief}-${index}`}
                            selected={isSelected}
                            saved={saved}
                            onSelect={() =>
                              patchLocal({
                                selectedCandidate: candidate.belief,
                              })
                            }
                            tone="amber"
                          >
                            <p className={styles.sectionTitle}>
                              {candidate.belief}
                            </p>
                            <p className={styles.sectionHint}>
                              {candidate.emotionReason}
                            </p>
                          </SelectionCard>
                        );
                      })}
                    </div>
                  </AiCandidatesPanel>
                )}
              </>
            )}
          </div>
        )}

        {flow.mode === "direct" && (
          <div className={styles.sectionStack}>
            {flow.directStep === "select-emotion" && (
              <div className={styles.selectionRow}>
                <p className={styles.sectionTitle}>감정 선택</p>
                <p className={styles.sectionHint}>
                  선택한 감정은 자동사고와 함께 저장됩니다.
                </p>
                    <EmotionOptionSelector
                      value={local.selectedEmotion}
                      onSelect={(value) =>
                        patchLocal({ selectedEmotion: value })
                      }
                    />
                <EmotionNoteAddSelectionReveal
                  isVisible={Boolean(selectedEmotionMeta)}
                >
                  {selectedEmotionMeta ? (
                    <div className={styles.revealInner}>
                      <p className={styles.revealTitle}>
                        {selectedEmotionMeta.description}
                      </p>
                      <p className={styles.revealText}>
                        {selectedEmotionMeta.physical}
                      </p>
                      <div className={styles.revealList}>
                        {selectedEmotionMeta.positive.map((item, index) => (
                          <div
                            key={`${selectedEmotionMeta.id}-positive-${index}`}
                            className={styles.revealListItem}
                          >
                            <span>•</span>
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </EmotionNoteAddSelectionReveal>
              </div>
            )}

            {flow.directStep === "input" && (
              <>
                {local.selectedEmotion.trim() && (
                  <div className={styles.inputMeta}>
                    <span className={styles.selectedChip}>
                      선택된 감정: {local.selectedEmotion}
                    </span>
                  </div>
                )}
                <div className={styles.inputStack}>
                  <BlinkTextarea
                    value={local.directThought}
                    onChange={(value) => patchLocal({ directThought: value })}
                    placeholder="어떤 생각이 숨어있을까요?"
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
          onClick={() => void handleGenerateCandidates()}
          disabled={!local.selectedEmotion.trim() || flow.aiLoading}
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
          disabled={!local.selectedEmotion.trim()}
          className={styles.fab}
        />
      )}
      {showAiSave && (
        <>
          <FloatingActionButton
            label={saveLabel}
            icon={saveIcon}
            helperText="자동사고 저장"
            onClick={() => void handleSaveAi()}
            disabled={!canSaveAi || flow.isSaving}
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
          helperText="자동사고 저장"
          onClick={() => void handleSaveDirect()}
          disabled={flow.isSaving}
          loading={flow.isSaving}
          className={styles.fab}
        />
      )}
    </EmotionNoteAddPageLayout>
  );
}
