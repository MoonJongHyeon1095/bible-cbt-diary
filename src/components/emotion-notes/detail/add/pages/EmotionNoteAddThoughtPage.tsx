"use client";

import { useCbtToast } from "@/components/cbt/common/CbtToast";
import { validateUserText } from "@/components/cbt/utils/validation";
import FloatingActionButton from "@/components/common/FloatingActionButton";
import BlinkTextarea from "@/components/ui/BlinkTextarea";
import { generateExtendedAutomaticThoughts } from "@/lib/ai";
import { EMOTIONS } from "@/lib/constants/emotions";
import { checkAiUsageLimit } from "@/lib/utils/aiUsageGuard";
import {
  ArrowDownToLine,
  ArrowRight,
  BookSearch,
  Brain,
  Check,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import useEmotionNoteDetail from "../../hooks/useEmotionNoteDetail";
import { AiCandidatesPanel } from "../common/AiCandidatesPanel";
import { AiLoadingCard } from "../common/AiLoadingCard";
import { SelectionCard } from "../common/SelectionCard";
import EmotionNoteAddModeSelector, { AddMode } from "./EmotionNoteAddModeSelector";
import styles from "./EmotionNoteAddPage.module.css";
import EmotionNoteAddPageLayout from "./EmotionNoteAddPageLayout";
import { EmotionOptionSelector } from "./EmotionNoteAddOptionSelectors";
import EmotionNoteAddSelectionReveal from "./EmotionNoteAddSelectionReveal";

type ThoughtAddStep = "select-emotion" | "suggestions";
type ThoughtDirectStep = "select-emotion" | "input";

type ThoughtCandidate = {
  belief: string;
  emotionReason: string;
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
  const { accessMode, triggerText, error, thoughtSection } =
    useEmotionNoteDetail(noteId);
  const aiLocked = accessMode !== "auth";

  const [mode, setMode] = useState<AddMode | null>(forcedMode ?? null);
  const [selectedEmotion, setSelectedEmotion] = useState("");
  const [directThought, setDirectThought] = useState("");
  const [aiStep, setAiStep] = useState<ThoughtAddStep>("select-emotion");
  const [directStep, setDirectStep] =
    useState<ThoughtDirectStep>("select-emotion");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiCandidates, setAiCandidates] = useState<ThoughtCandidate[]>([]);
  const [aiError, setAiError] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState("");
  const [savedCandidates, setSavedCandidates] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const lastErrorRef = useRef<string | null>(null);
  const selectedEmotionMeta = useMemo(
    () => EMOTIONS.find((item) => item.label === selectedEmotion) ?? null,
    [selectedEmotion],
  );

  useEffect(() => {
    if (error && error !== lastErrorRef.current) {
      pushToast(error, "error");
      lastErrorRef.current = error;
    }
  }, [error, pushToast]);

  const isSelectedSaved = useMemo(
    () => savedCandidates.includes(selectedCandidate),
    [savedCandidates, selectedCandidate],
  );

  const canSaveAi = useMemo(
    () =>
      Boolean(
        selectedEmotion.trim() && selectedCandidate.trim() && !isSelectedSaved,
      ),
    [selectedCandidate, selectedEmotion, isSelectedSaved],
  );

  const handleClose = () => {
    if (mode === "ai") {
      if (aiStep === "suggestions") {
        setAiStep("select-emotion");
        return;
      }
    }
    if (mode === "direct") {
      if (directStep === "input") {
        setDirectStep("select-emotion");
        return;
      }
    }
    if (mode && !forcedMode) {
      resetFlow();
      setMode(null);
      return;
    }
    if (forcedMode) {
      router.push(`/detail/add/thought?id=${noteId}`);
      return;
    }
    router.push(`/detail?id=${noteId}`);
  };

  const resetFlow = () => {
    setSelectedEmotion("");
    setDirectThought("");
    setAiCandidates([]);
    setAiError(null);
    setSelectedCandidate("");
    setSavedCandidates([]);
    setAiStep("select-emotion");
    setDirectStep("select-emotion");
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
    if (!selectedEmotion.trim()) {
      pushToast("감정을 먼저 선택해주세요.", "error");
      return false;
    }
    return true;
  };

  const handleGenerateCandidates = async () => {
    const ready = await ensureAiReady();
    if (!ready) return;
    setAiLoading(true);
    setAiError(null);
    setAiCandidates([]);
    try {
      const result = await generateExtendedAutomaticThoughts(
        triggerText,
        selectedEmotion,
        { noteProposal: true },
      );
      const candidates = result.sdtThoughts.map((item) => ({
        belief: item.belief,
        emotionReason: item.emotionReason,
      }));
      setAiCandidates(candidates);
      setAiStep("suggestions");
    } catch (aiErr) {
      console.error(aiErr);
      setAiError("AI 제안을 불러오지 못했습니다.");
    } finally {
      setAiLoading(false);
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
    setIsSaving(true);
    const ok = await thoughtSection.handleAddWithValues(
      selectedCandidate.trim(),
      selectedEmotion.trim(),
    );
    setIsSaving(false);
    if (ok) {
      setSavedCandidates((prev) =>
        prev.includes(selectedCandidate) ? prev : [...prev, selectedCandidate],
      );
      pushToast("자동사고를 저장했어요.", "success");
    }
  };

  const handleSaveDirect = async () => {
    const validation = validateUserText(directThought, {
      minLength: 10,
      minLengthMessage: "자동사고를 10자 이상 입력해주세요.",
    });
    if (!validation.ok) {
      pushToast(validation.message, "error");
      return;
    }
    if (!selectedEmotion.trim()) {
      pushToast("감정을 선택해주세요.", "error");
      return;
    }
    setIsSaving(true);
    const ok = await thoughtSection.handleAddWithValues(
      directThought.trim(),
      selectedEmotion.trim(),
    );
    setIsSaving(false);
    if (ok) {
      pushToast("자동사고를 저장했어요.", "success");
      router.push(`/detail?id=${noteId}`);
    }
  };

  const showAiNext = mode === "ai" && aiStep === "select-emotion";
  const showDirectNext = mode === "direct" && directStep === "select-emotion";
  const showAiSave = mode === "ai" && aiStep === "suggestions";
  const showDirectSave = mode === "direct" && directStep === "input";
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
              value={mode}
              onSelect={handleModeSelect}
              aiLocked={aiLocked}
            />
          </div>
        ) : null}

        {mode === "ai" && (
          <div className={styles.sectionStack}>
            {aiLoading ? (
              <div className={styles.stepCenter}>
                <AiLoadingCard
                  title="자동사고 생성 중"
                  description="선택한 감정을 바탕으로 후보를 만들고 있어요."
                  tone="amber"
                />
              </div>
            ) : (
              <>
                {aiStep === "select-emotion" && (
                  <div className={styles.selectionRow}>
                  <p className={styles.sectionTitle}>감정 선택</p>
                  <p className={styles.sectionHint}>
                    감정을 먼저 선택해야 AI 제안을 받을 수 있어요.
                  </p>
                  <EmotionOptionSelector
                    value={selectedEmotion}
                    onSelect={(next) => {
                      setSelectedEmotion(next);
                      setSelectedCandidate("");
                      setAiCandidates([]);
                      setAiError(null);
                      setSavedCandidates([]);
                      setAiStep("select-emotion");
                    }}
                  />
                </div>
                )}

                {aiStep === "select-emotion" && (
                  <EmotionNoteAddSelectionReveal isVisible={Boolean(selectedEmotionMeta)}>
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

                {aiError && <div className={styles.errorBox}>{aiError}</div>}

                {aiStep === "suggestions" && (
                  <AiCandidatesPanel
                    title="AI 자동사고 후보"
                    description="원하는 제안을 선택한 뒤 저장하세요."
                    countText={`${aiCandidates.length}개 추천`}
                    tone="amber"
                  >
                    <div className={styles.candidateList}>
                      {aiCandidates.map((candidate, index) => {
                        const isSelected =
                          selectedCandidate.trim() === candidate.belief.trim();
                        const saved = savedCandidates.includes(candidate.belief);
                        return (
                          <SelectionCard
                            key={`${candidate.belief}-${index}`}
                            selected={isSelected}
                            saved={saved}
                            onSelect={() =>
                              setSelectedCandidate(candidate.belief)
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

        {mode === "direct" && (
          <div className={styles.sectionStack}>
            {directStep === "select-emotion" && (
              <div className={styles.selectionRow}>
                <p className={styles.sectionTitle}>감정 선택</p>
                <p className={styles.sectionHint}>
                  선택한 감정은 자동사고와 함께 저장됩니다.
                </p>
                <EmotionOptionSelector
                  value={selectedEmotion}
                  onSelect={setSelectedEmotion}
                />
                <EmotionNoteAddSelectionReveal isVisible={Boolean(selectedEmotionMeta)}>
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

            {directStep === "input" && (
              <>
                {selectedEmotion.trim() && (
                  <div className={styles.inputMeta}>
                    <span className={styles.selectedChip}>
                      선택된 감정: {selectedEmotion}
                    </span>
                  </div>
                )}
                <div className={styles.inputStack}>
                  <BlinkTextarea
                    value={directThought}
                    onChange={setDirectThought}
                    placeholder="어떤 생각이 숨어있을까요?"
                  />
                  <p className={styles.helperText}>
                    입력한 내용은 바로 자동사고로 저장됩니다.
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
          disabled={!selectedEmotion.trim() || aiLoading}
          loading={aiLoading}
          className={styles.fab}
        />
      )}
      {showDirectNext && (
        <FloatingActionButton
          label="다음"
          icon={<ArrowRight size={22} />}
          helperText="다음"
          onClick={() => setDirectStep("input")}
          disabled={!selectedEmotion.trim()}
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
            disabled={!canSaveAi || isSaving}
            loading={isSaving}
            className={`${styles.fab} ${styles.fabSave}`}
          />
          <FloatingActionButton
            label="노트로 돌아가기"
            icon={<BookSearch size={20} />}
            helperText="노트로 돌아가기"
            onClick={() => router.push(`/detail?id=${noteId}`)}
            className={`${styles.fabSecondary} ${styles.fabSaveSecondary}`}
          />
        </>
      )}
      {showDirectSave && (
        <FloatingActionButton
          label="저장"
          icon={<ArrowDownToLine size={22} />}
          helperText="자동사고 저장"
          onClick={() => void handleSaveDirect()}
          disabled={isSaving}
          loading={isSaving}
          className={`${styles.fab} ${styles.fabSave}`}
        />
      )}
    </EmotionNoteAddPageLayout>
  );
}
