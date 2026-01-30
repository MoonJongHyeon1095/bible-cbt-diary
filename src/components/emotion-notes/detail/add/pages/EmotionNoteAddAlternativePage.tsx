"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  BookSearch,
  Check,
  Lightbulb,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { generateContextualAlternativeThoughts } from "@/lib/ai";
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
import styles from "./EmotionNoteAddPage.module.css";

type AlternativeAiStep = "select-thought" | "select-errors" | "suggestions";
type AlternativeDirectStep = "select-thought" | "select-errors" | "input";

type AlternativeCandidate = {
  thought: string;
  technique: string;
  techniqueDescription: string;
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
  const {
    accessMode,
    triggerText,
    error,
    thoughtSection,
    errorSection,
    alternativeSection,
  } = useEmotionNoteDetail(noteId);
  const aiLocked = accessMode !== "auth";

  const [mode, setMode] = useState<AddMode | null>(forcedMode ?? null);
  const [aiStep, setAiStep] = useState<AlternativeAiStep>("select-thought");
  const [directStep, setDirectStep] = useState<AlternativeDirectStep>(
    "select-thought",
  );
  const [selectedThoughtId, setSelectedThoughtId] = useState("");
  const [selectedErrorIds, setSelectedErrorIds] = useState<string[]>([]);
  const [expandedThoughtIds, setExpandedThoughtIds] = useState<string[]>([]);
  const [expandedErrorIds, setExpandedErrorIds] = useState<string[]>([]);
  const [aiCandidates, setAiCandidates] = useState<AlternativeCandidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState("");
  const [savedCandidates, setSavedCandidates] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [directText, setDirectText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const lastErrorRef = useRef<string | null>(null);

  useEffect(() => {
    if (error && error !== lastErrorRef.current) {
      pushToast(error, "error");
      lastErrorRef.current = error;
    }
  }, [error, pushToast]);

  useEffect(() => {
    setAiCandidates([]);
    setSelectedCandidate("");
    setAiError(null);
    setSavedCandidates([]);
  }, [selectedThoughtId, selectedErrorIds]);

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

  const handleClose = () => {
    if (mode === "ai") {
      if (aiStep === "suggestions") {
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
        setDirectStep("select-errors");
        return;
      }
      if (directStep === "select-errors") {
        setDirectStep("select-thought");
        return;
      }
    }
    if (mode && !forcedMode) {
      resetFlow();
      setMode(null);
      return;
    }
    if (forcedMode) {
      router.push(`/detail/${noteId}/add/alternative`);
      return;
    }
    router.push(`/detail/${noteId}`);
  };

  const resetFlow = () => {
    setAiStep("select-thought");
    setDirectStep("select-thought");
    setSelectedThoughtId("");
    setSelectedErrorIds([]);
    setExpandedThoughtIds([]);
    setExpandedErrorIds([]);
    setAiCandidates([]);
    setSelectedCandidate("");
    setSavedCandidates([]);
    setAiError(null);
    setDirectText("");
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
    setAiLoading(true);
    setAiError(null);
    setAiCandidates([]);
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
      setAiCandidates(result);
      setAiStep("suggestions");
    } catch (aiErr) {
      console.error(aiErr);
      setAiError("AI 제안을 불러오지 못했습니다.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSaveAi = async () => {
    if (!selectedCandidate.trim()) {
      pushToast("대안사고를 선택해주세요.", "error");
      return;
    }
    if (savedCandidates.includes(selectedCandidate)) {
      pushToast("이미 저장된 제안입니다.", "info");
      return;
    }
    setIsSaving(true);
    const ok = await alternativeSection.handleAddWithValues(
      selectedCandidate.trim(),
    );
    setIsSaving(false);
    if (ok) {
      setSavedCandidates((prev) =>
        prev.includes(selectedCandidate)
          ? prev
          : [...prev, selectedCandidate],
      );
      pushToast("대안사고를 저장했어요.", "success");
    }
  };

  const handleSaveDirect = async () => {
    const validation = validateUserText(directText, {
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
    setIsSaving(true);
    const ok = await alternativeSection.handleAddWithValues(directText.trim());
    setIsSaving(false);
    if (ok) {
      pushToast("대안사고를 저장했어요.", "success");
      router.push(`/detail/${noteId}`);
    }
  };

  const isSelectedSaved = useMemo(
    () => savedCandidates.includes(selectedCandidate),
    [savedCandidates, selectedCandidate],
  );

  const showAiNext = mode === "ai" && aiStep !== "suggestions";
  const showDirectNext = mode === "direct" && directStep !== "input";
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
    (aiStep === "select-errors" && selectedErrorIds.length === 0);

  const nextDisabledDirect =
    (directStep === "select-thought" && !selectedThoughtId) ||
    (directStep === "select-errors" && selectedErrorIds.length === 0);

  const handleAiNext = () => {
    if (aiStep === "select-thought") {
      setAiStep("select-errors");
      return;
    }
    if (aiStep === "select-errors") {
      void handleGenerateCandidates();
    }
  };

  const handleDirectNext = () => {
    if (directStep === "select-thought") {
      setDirectStep("select-errors");
      return;
    }
    if (directStep === "select-errors") {
      setDirectStep("input");
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
                          tone="green"
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
                            tone="green"
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
                              setExpandedErrorIds((prev) =>
                                prev.includes(String(errorDetail.id))
                                  ? prev.filter((id) => id !== String(errorDetail.id))
                                  : [...prev, String(errorDetail.id)],
                              )
                            }
                            tone="green"
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
                    title="대안사고 생성 중"
                    description="선택한 자동사고와 인지오류를 반영하고 있어요."
                    tone="green"
                  />
                </div>
              )}

              {!aiLoading && aiError && (
                <div className={styles.errorBox}>{aiError}</div>
              )}

              {!aiLoading && aiStep === "suggestions" && (
                <AiCandidatesPanel
                  title="AI 대안사고 후보"
                  description="원하는 제안을 선택한 뒤 저장하세요."
                  countText={`${aiCandidates.length}개 추천`}
                  tone="green"
                >
                  <div className={styles.candidateList}>
                    {aiCandidates.map((candidate, index) => {
                      const isSelected =
                        selectedCandidate.trim() === candidate.thought.trim();
                      const saved = savedCandidates.includes(candidate.thought);
                      return (
                        <SelectionCard
                          key={`${candidate.thought}-${index}`}
                          selected={isSelected}
                          saved={saved}
                          onSelect={() => setSelectedCandidate(candidate.thought)}
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

          {mode === "direct" && (
            <div className={styles.sectionStack}>
              {directStep === "select-thought" && (
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
                          tone="green"
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
                            tone="green"
                          />
                        </SelectionCard>
                      );
                    })}
                  </SelectionPanel>
                </div>
              )}
              {directStep === "select-errors" && (
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
                              setExpandedErrorIds((prev) =>
                                prev.includes(String(errorDetail.id))
                                  ? prev.filter((id) => id !== String(errorDetail.id))
                                  : [...prev, String(errorDetail.id)],
                              )
                            }
                            tone="green"
                          />
                        </SelectionCard>
                      );
                    })}
                  </SelectionPanel>
                </div>
              )}

              {directStep === "input" && (
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
                            <div className={styles.revealList}>
                              <div className={styles.revealListItem}>
                                <span>•</span>
                                <span>
                                  {selectedThought.emotion?.trim() || "감정 미선택"}{" "}
                                  -{" "}
                                  {selectedThought.automatic_thought?.trim() ||
                                    "-"}
                                </span>
                              </div>
                            </div>
                          </>
                        ) : null}
                        {selectedErrors.length > 0 ? (
                          <>
                            <p className={styles.summaryLabel}>인지오류</p>
                            <div className={styles.revealList}>
                              {selectedErrors.map((errorDetail) => (
                                <div
                                  key={errorDetail.id}
                                  className={styles.revealListItem}
                                >
                                  <span>•</span>
                                  <span>
                                    {formatErrorLabel(errorDetail.error_label)} -{" "}
                                    {errorDetail.error_description ||
                                      "설명이 없습니다."}
                                  </span>
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
                      value={directText}
                      onChange={setDirectText}
                      placeholder="대안적 사고를 적어주세요."
                    />
                    <p className={styles.helperText}>
                      입력한 내용은 바로 대안사고로 저장됩니다.
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
            helperText="대안사고 저장"
            onClick={() => void handleSaveAi()}
            disabled={!selectedCandidate.trim() || isSaving || isSelectedSaved}
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
          helperText="대안사고 저장"
          onClick={() => void handleSaveDirect()}
          disabled={isSaving}
          loading={isSaving}
          className={`${styles.fab} ${styles.fabSave}`}
        />
      )}
    </EmotionNoteAddPageLayout>
  );
}
