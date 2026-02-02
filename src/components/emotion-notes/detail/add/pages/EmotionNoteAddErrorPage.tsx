"use client";

import { useCbtToast } from "@/components/cbt/common/CbtToast";
import { validateUserText } from "@/components/cbt/utils/validation";
import FloatingActionButton from "@/components/common/FloatingActionButton";
import { useAuthModal } from "@/components/header/AuthModalProvider";
import BlinkTextarea from "@/components/ui/BlinkTextarea";
import { analyzeCognitiveErrorDetails } from "@/lib/ai";
import { COGNITIVE_ERRORS } from "@/lib/constants/errors";
import { checkAiUsageLimit } from "@/lib/utils/aiUsageGuard";
import {
  AlertCircle,
  ArrowDownToLine,
  ArrowRight,
  BookSearch,
  Check,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import useEmotionNoteDetail from "../../hooks/useEmotionNoteDetail";
import { AiCandidatesPanel } from "../common/AiCandidatesPanel";
import { AiLoadingCard } from "../common/AiLoadingCard";
import { ExpandableText } from "../common/ExpandableText";
import { SelectionCard } from "../common/SelectionCard";
import { SelectionPanel } from "../common/SelectionPanel";
import EmotionNoteAddModeSelector, {
  AddMode,
} from "./EmotionNoteAddModeSelector";
import { ErrorOptionSelector } from "./EmotionNoteAddOptionSelectors";
import styles from "./EmotionNoteAddPage.module.css";
import EmotionNoteAddPageLayout from "./EmotionNoteAddPageLayout";
import EmotionNoteAddSelectionReveal from "./EmotionNoteAddSelectionReveal";
import EmotionNoteAddSummaryItem from "./EmotionNoteAddSummaryItem";

type ErrorAiStep = "select-error" | "select-thought" | "suggestions";
type ErrorDirectStep = "select-error" | "input";

type EmotionNoteAddErrorPageProps = {
  noteId: number;
  mode?: AddMode;
};

export default function EmotionNoteAddErrorPage({
  noteId,
  mode: forcedMode,
}: EmotionNoteAddErrorPageProps) {
  const router = useRouter();
  const { pushToast } = useCbtToast();
  const { openAuthModal } = useAuthModal();
  const { accessMode, triggerText, error, thoughtSection, errorSection } =
    useEmotionNoteDetail(noteId);
  const aiLocked = accessMode !== "auth";

  const [mode, setMode] = useState<AddMode | null>(forcedMode ?? null);
  const [errorLabel, setErrorLabel] = useState("");
  const [directDescription, setDirectDescription] = useState("");
  const [aiStep, setAiStep] = useState<ErrorAiStep>("select-error");
  const [directStep, setDirectStep] = useState<ErrorDirectStep>("select-error");
  const [selectedThoughtId, setSelectedThoughtId] = useState("");
  const [expandedThoughtIds, setExpandedThoughtIds] = useState<string[]>([]);
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [selectedSuggestion, setSelectedSuggestion] = useState("");
  const [savedSuggestions, setSavedSuggestions] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const lastErrorRef = useRef<string | null>(null);
  const selectedErrorMeta = useMemo(
    () => COGNITIVE_ERRORS.find((item) => item.title === errorLabel) ?? null,
    [errorLabel],
  );

  useEffect(() => {
    if (error && error !== lastErrorRef.current) {
      pushToast(error, "error");
      lastErrorRef.current = error;
    }
  }, [error, pushToast]);

  useEffect(() => {
    setAiSuggestion("");
    setSelectedSuggestion("");
    setAiError(null);
    setSavedSuggestions([]);
  }, [errorLabel, selectedThoughtId]);

  const selectedThought = useMemo(
    () =>
      thoughtSection.details.find(
        (detail) => String(detail.id) === selectedThoughtId,
      ) ?? null,
    [selectedThoughtId, thoughtSection.details],
  );

  const handleClose = () => {
    if (mode === "ai") {
      if (aiStep === "suggestions") {
        setAiStep("select-thought");
        return;
      }
      if (aiStep === "select-thought") {
        setAiStep("select-error");
        return;
      }
    }
    if (mode === "direct") {
      if (directStep === "input") {
        setDirectStep("select-error");
        return;
      }
    }
    if (mode && !forcedMode) {
      resetFlow();
      setMode(null);
      return;
    }
    if (forcedMode) {
      router.push(`/detail/add/error?id=${noteId}`);
      return;
    }
    router.push(`/detail?id=${noteId}`);
  };

  const resetFlow = () => {
    setErrorLabel("");
    setDirectDescription("");
    setAiStep("select-error");
    setDirectStep("select-error");
    setSelectedThoughtId("");
    setExpandedThoughtIds([]);
    setAiSuggestion("");
    setSelectedSuggestion("");
    setAiError(null);
    setSavedSuggestions([]);
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
      openAuthModal();
      return false;
    }
    const allowed = await checkAiUsageLimit(pushToast);
    if (!allowed) return false;
    if (!triggerText.trim()) {
      pushToast("트리거 텍스트를 먼저 입력해주세요.", "error");
      return false;
    }
    if (!errorLabel.trim()) {
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
    const meta = COGNITIVE_ERRORS.find((error) => error.title === errorLabel);
    if (!meta) {
      pushToast("인지오류 정보를 찾을 수 없습니다.", "error");
      return;
    }
    setAiLoading(true);
    setAiError(null);
    setAiSuggestion("");
    try {
      const result = await analyzeCognitiveErrorDetails(
        triggerText,
        selectedThought.automatic_thought,
        [meta.index],
        { noteProposal: true },
      );
      const analysis = result.errors[0]?.analysis ?? "";
      if (!analysis.trim()) {
        throw new Error("인지오류 설명이 없습니다.");
      }
      setAiSuggestion(analysis);
      setSelectedSuggestion(analysis);
      setAiStep("suggestions");
    } catch (aiErr) {
      console.error(aiErr);
      setAiError("AI 제안을 불러오지 못했습니다.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSaveAi = async () => {
    if (!errorLabel.trim() || !selectedSuggestion.trim()) {
      pushToast("인지오류 제안을 선택해주세요.", "error");
      return;
    }
    if (isSelectedSaved) {
      pushToast("이미 저장된 제안입니다.", "info");
      return;
    }
    setIsSaving(true);
    const ok = await errorSection.handleAddWithValues(
      errorLabel.trim(),
      selectedSuggestion.trim(),
    );
    setIsSaving(false);
    if (ok) {
      setSavedSuggestions((prev) =>
        prev.includes(selectedSuggestion)
          ? prev
          : [...prev, selectedSuggestion],
      );
      pushToast("인지오류를 저장했어요.", "success");
    }
  };

  const handleSaveDirect = async () => {
    const validation = validateUserText(directDescription, {
      minLength: 10,
      minLengthMessage: "인지오류 설명을 10자 이상 입력해주세요.",
    });
    if (!validation.ok) {
      pushToast(validation.message, "error");
      return;
    }
    if (!errorLabel.trim()) {
      pushToast("인지오류를 선택해주세요.", "error");
      return;
    }
    setIsSaving(true);
    const ok = await errorSection.handleAddWithValues(
      errorLabel.trim(),
      directDescription.trim(),
    );
    setIsSaving(false);
    if (ok) {
      pushToast("인지오류를 저장했어요.", "success");
      router.push(`/detail?id=${noteId}`);
    }
  };

  const isSelectedSaved = useMemo(
    () => savedSuggestions.includes(selectedSuggestion),
    [savedSuggestions, selectedSuggestion],
  );

  const showAiNext = mode === "ai" && aiStep !== "suggestions";
  const showDirectNext = mode === "direct" && directStep === "select-error";
  const showAiSave = mode === "ai" && aiStep === "suggestions";
  const showDirectSave = mode === "direct" && directStep === "input";
  const saveLabel = isSelectedSaved ? "저장됨" : "저장";
  const saveIcon = isSelectedSaved ? (
    <Check size={22} />
  ) : (
    <ArrowDownToLine size={22} />
  );

  const nextDisabledAi =
    (aiStep === "select-error" && !errorLabel.trim()) ||
    (aiStep === "select-thought" && !selectedThoughtId);

  const handleAiNext = () => {
    if (aiStep === "select-error") {
      if (!errorLabel.trim()) return;
      setAiStep("select-thought");
      return;
    }
    if (aiStep === "select-thought") {
      if (!selectedThoughtId) return;
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
              value={mode}
              onSelect={handleModeSelect}
              aiLocked={aiLocked}
              onLockedClick={() => openAuthModal()}
            />
          </div>
        ) : null}

        {mode === "ai" && (
          <div className={styles.sectionStack}>
            {aiLoading ? (
              <div className={styles.stepCenter}>
                <AiLoadingCard
                  title="인지오류 설명 생성 중"
                  description="선택한 자동사고를 분석하고 있어요."
                  tone="rose"
                />
              </div>
            ) : (
              <>
                {aiStep === "select-error" && (
                  <div className={styles.selectionRow}>
                    <p className={styles.sectionTitle}>인지오류 선택</p>
                    <p className={styles.sectionHint}>
                      인지오류를 먼저 선택해야 합니다.
                    </p>
                    <ErrorOptionSelector
                      value={errorLabel}
                      onSelect={(next) => {
                        setErrorLabel(next);
                        setSelectedSuggestion("");
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

                {aiStep === "select-thought" && (
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
                          selectedThoughtId === String(detail.id);
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
                            onSelect={() =>
                              setSelectedThoughtId(String(detail.id))
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
                                setExpandedThoughtIds((prev) =>
                                  prev.includes(String(detail.id))
                                    ? prev.filter(
                                        (id) => id !== String(detail.id),
                                      )
                                    : [...prev, String(detail.id)],
                                )
                              }
                              tone="rose"
                            />
                          </SelectionCard>
                        );
                      })}
                    </SelectionPanel>
                  </div>
                )}

                {aiError && <div className={styles.errorBox}>{aiError}</div>}

                {aiStep === "suggestions" && aiSuggestion && (
                  <AiCandidatesPanel
                    title="AI 인지오류 제안"
                    description="선택한 제안을 저장하세요."
                    tone="rose"
                  >
                    <SelectionCard
                      selected={Boolean(selectedSuggestion.trim())}
                      saved={savedSuggestions.includes(aiSuggestion)}
                      onSelect={() => setSelectedSuggestion(aiSuggestion)}
                      tone="rose"
                    >
                      {aiSuggestion}
                    </SelectionCard>
                  </AiCandidatesPanel>
                )}
              </>
            )}
          </div>
        )}

        {mode === "direct" && (
          <div className={styles.sectionStack}>
            {directStep === "select-error" && (
              <div className={styles.selectionRow}>
                <p className={styles.sectionTitle}>인지오류 선택</p>
                <p className={styles.sectionHint}>
                  선택한 인지오류는 설명과 함께 저장됩니다.
                </p>
                <ErrorOptionSelector
                  value={errorLabel}
                  onSelect={setErrorLabel}
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

            {directStep === "input" && (
              <>
                {errorLabel.trim() && (
                  <details className={styles.summaryBox}>
                    <summary className={styles.summaryToggle}>
                      <span className={styles.summaryToggleContent}>
                        <span className={styles.summaryToggleLabel}>
                          선택한 인지오류 보기
                        </span>
                        <span className={styles.selectedChip}>
                          {errorLabel}
                        </span>
                      </span>
                    </summary>
                    <div className={styles.summaryBody}>
                      <div className={styles.summaryGrid}>
                        <EmotionNoteAddSummaryItem
                          label={errorLabel}
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
                    value={directDescription}
                    onChange={setDirectDescription}
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
          onClick={() => setDirectStep("input")}
          disabled={!errorLabel.trim()}
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
            disabled={!selectedSuggestion.trim() || isSaving || isSelectedSaved}
            loading={isSaving}
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
          disabled={isSaving}
          loading={isSaving}
          className={styles.fab}
        />
      )}
    </EmotionNoteAddPageLayout>
  );
}
