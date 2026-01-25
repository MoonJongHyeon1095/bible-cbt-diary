"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { EmotionNote } from "@/lib/types";
import type { SelectedCognitiveError } from "@/lib/cbtTypes";
import { CbtToastProvider, useCbtToast } from "@/components/cbt/common/CbtToast";
import { useCbtAccess } from "@/components/cbt/hooks/useCbtAccess";
import { clearCbtSessionStorage } from "@/components/cbt/utils/storage/cbtSessionStorage";
import { saveDeepSessionAPI } from "@/components/cbt/utils/api";
import { formatAutoTitle } from "@/components/cbt/utils/formatAutoTitle";
import { fetchEmotionGraph, fetchEmotionNoteById } from "@/components/graph/utils/emotionGraphApi";
import { MinimalEmotionSection } from "@/components/cbt/minimal/center/MinimalEmotionSection";
import { MinimalFloatingBackButton } from "@/components/cbt/minimal/common/MinimalFloatingBackButton";
import { MinimalFloatingHomeButton } from "@/components/cbt/minimal/common/MinimalFloatingHomeButton";
import { MinimalSavingModal } from "@/components/cbt/minimal/common/MinimalSavingModal";
import { MinimalLoadingState } from "@/components/cbt/minimal/common/MinimalLoadingState";
import styles from "@/components/cbt/minimal/MinimalStyles.module.css";
import { DeepIncidentSection } from "./center/DeepIncidentSection";
import { DeepAutoThoughtSection } from "./center/DeepAutoThoughtSection";
import { DeepCognitiveErrorSection } from "./left/DeepCognitiveErrorSection";
import { DeepAlternativeThoughtSection } from "./right/DeepAlternativeThoughtSection";

const parseIds = (value: string | null) => {
  if (!value) return [] as number[];
  return value
    .split(",")
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item));
};

type DeepStep = "incident" | "emotion" | "thought" | "errors" | "alternative";

function DeepSessionPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { pushToast } = useCbtToast();
  const { supabase, requireAccessToken } = useCbtAccess({
    setError: (message) => pushToast(message, "error"),
  });

  const mainIdParam = searchParams.get("mainId") ?? "";
  const groupIdParam = searchParams.get("groupId") ?? "";
  const subIdsParam = searchParams.get("subIds") ?? "";

  const mainId = useMemo(
    () => (mainIdParam ? Number(mainIdParam) : Number.NaN),
    [mainIdParam],
  );
  const groupId = useMemo(() => {
    const parsed = groupIdParam ? Number(groupIdParam) : null;
    return parsed !== null && Number.isFinite(parsed) ? parsed : null;
  }, [groupIdParam]);
  const subIds = useMemo(() => parseIds(subIdsParam), [subIdsParam]);
  const subIdSet = useMemo(() => new Set(subIds), [subIds]);

  const [notesLoading, setNotesLoading] = useState(true);
  const [notesError, setNotesError] = useState<string | null>(null);
  const [mainNote, setMainNote] = useState<EmotionNote | null>(null);
  const [subNotes, setSubNotes] = useState<EmotionNote[]>([]);
  const requestIdRef = useRef(0);
  const lastLoadKeyRef = useRef("");
  const inFlightRef = useRef(false);

  const [step, setStep] = useState<DeepStep>("incident");
  const [userInput, setUserInput] = useState("");
  const [selectedEmotion, setSelectedEmotion] = useState("");
  const [autoThought, setAutoThought] = useState("");
  const [summary, setSummary] = useState("");
  const [selectedCognitiveErrors, setSelectedCognitiveErrors] = useState<
    SelectedCognitiveError[]
  >([]);
  const [alternativeSeed, setAlternativeSeed] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const lastErrorsKeyRef = useRef<string>("");

  const stepOrder: DeepStep[] = [
    "incident",
    "emotion",
    "thought",
    "errors",
    "alternative",
  ];
  const currentStepIndex = stepOrder.indexOf(step);

  const previousAlternatives = useMemo(() => {
    const notes = mainNote ? [mainNote, ...subNotes] : subNotes;
    const alternatives = notes.flatMap((note) =>
      (note.alternative_details ?? []).map((detail) => detail.alternative),
    );
    return alternatives.filter(Boolean);
  }, [mainNote, subNotes]);

  const loadKey = useMemo(
    () => `${mainIdParam}|${groupIdParam}|${subIdsParam}`,
    [groupIdParam, mainIdParam, subIdsParam],
  );

  useEffect(() => {
    const load = async () => {
      if (inFlightRef.current && lastLoadKeyRef.current === loadKey) {
        return;
      }
      if (lastLoadKeyRef.current === loadKey && mainNote && !notesLoading) {
        return;
      }
      inFlightRef.current = true;
      lastLoadKeyRef.current = loadKey;
      const requestId = ++requestIdRef.current;
      try {
        if (!Number.isFinite(mainId) || Number.isNaN(mainId)) {
          setNotesError("mainId가 필요합니다.");
          setNotesLoading(false);
          return;
        }

        if (groupIdParam && groupId === null) {
          setNotesError("groupId가 올바르지 않습니다.");
          setNotesLoading(false);
          return;
        }

        if (groupId && (subIds.length < 1 || subIds.length > 2)) {
          setNotesError("subIds는 1~2개여야 합니다.");
          setNotesLoading(false);
          return;
        }

        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData.session?.access_token ?? null;
        if (!accessToken || requestId !== requestIdRef.current) return;

        setNotesLoading(true);
        setNotesError(null);

        if (groupId) {
          const { response, data } = await fetchEmotionGraph(accessToken, groupId);
          if (requestId !== requestIdRef.current) return;
          if (!response.ok) {
            setNotesError("노트를 불러오지 못했습니다.");
            setNotesLoading(false);
            return;
          }
          const allNotes = data.notes ?? [];
          const main = allNotes.find((note) => note.id === mainId) ?? null;
          const subs = allNotes
            .filter((note) => subIdSet.has(note.id))
            .sort((a, b) => b.id - a.id);

          if (!main) {
            setNotesError("메인 노트를 찾지 못했습니다.");
            setNotesLoading(false);
            return;
          }

          setMainNote(main);
          setSubNotes(subs);
          setNotesLoading(false);
          return;
        }

        const { response, data } = await fetchEmotionNoteById(
          accessToken,
          mainId,
        );
        if (requestId !== requestIdRef.current) return;
        if (!response.ok || !data.note) {
          setNotesError("노트를 불러오지 못했습니다.");
          setNotesLoading(false);
          return;
        }
        setMainNote(data.note);
        setSubNotes([]);
        setNotesLoading(false);
      } finally {
        inFlightRef.current = false;
      }
    };

    void load();
  }, [
    groupId,
    groupIdParam,
    mainId,
    loadKey,
    mainNote,
    notesLoading,
    supabase,
    subIdSet,
    subIds.length,
  ]);

  const handleBack = () => {
    if (currentStepIndex <= 0) return;
    setStep(stepOrder[currentStepIndex - 1]);
  };

  const handleGoHome = () => {
    clearCbtSessionStorage();
    router.push("/today");
  };

  const handleSelectErrors = (errors: SelectedCognitiveError[]) => {
    const nextKey = JSON.stringify(
      errors.map((item) => ({
        id: item.id,
        index: item.index,
        title: item.title,
        detail: item.detail,
      })),
    );
    if (nextKey !== lastErrorsKeyRef.current) {
      setAlternativeSeed((prev) => prev + 1);
      lastErrorsKeyRef.current = nextKey;
    }
    setSelectedCognitiveErrors(errors);
    setStep("alternative");
  };

  const handleComplete = async (thought: string) => {
    if (isSaving || !mainNote) return;
    const accessToken = await requireAccessToken();
    if (!accessToken) return;

    setIsSaving(true);

    try {
      const result = await saveDeepSessionAPI(accessToken, {
        title: formatAutoTitle(new Date(), selectedEmotion),
        trigger_text: userInput,
        emotion: selectedEmotion,
        automatic_thought: autoThought,
        selected_cognitive_error: selectedCognitiveErrors[0] ?? null,
        selected_alternative_thought: thought,
        main_id: mainNote.id,
        sub_ids: subNotes.map((note) => note.id),
        group_id: groupId ?? null,
      });

      if (!result.ok) {
        throw new Error("save_deep_session_failed");
      }

      const noteId = result.payload?.noteId;
      if (!noteId) {
        throw new Error("note_id_missing");
      }

      pushToast("세션 기록이 저장되었습니다.", "success");
      window.setTimeout(() => {
        clearCbtSessionStorage();
        router.push(`/detail/${noteId}`);
      }, 180);
    } catch (error) {
      console.error("deep 세션 저장 실패:", error);
      pushToast("세션 기록을 저장하지 못했습니다.", "error");
      setIsSaving(false);
    }
  };

  if (notesLoading) {
    return (
      <MinimalLoadingState
        title="준비 중입니다"
        message="기록을 불러오고 있어요."
        variant="page"
      />
    );
  }

  if (notesError || !mainNote) {
    return (
      <MinimalLoadingState
        title="진입할 수 없습니다"
        message={notesError ?? "노트를 찾지 못했습니다."}
        variant="page"
      />
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.bgWaves} />
      <div className={styles.content}>
        <MinimalSavingModal open={isSaving} />
        {currentStepIndex > 0 && (
          <div className={`${styles.floatingNav} ${styles.left}`}>
            <MinimalFloatingBackButton onClick={handleBack} />
          </div>
        )}
        <div className={`${styles.floatingNav} ${styles.right}`}>
          <MinimalFloatingHomeButton onClick={handleGoHome} />
        </div>

        {step === "incident" && (
          <DeepIncidentSection
            userInput={userInput}
            onInputChange={setUserInput}
            onNext={() => setStep("emotion")}
            mainNote={mainNote}
            subNotes={subNotes}
          />
        )}

        {step === "emotion" && (
          <MinimalEmotionSection
            selectedEmotion={selectedEmotion}
            onSelectEmotion={setSelectedEmotion}
            onNext={() => setStep("thought")}
          />
        )}

        {step === "thought" && (
          <DeepAutoThoughtSection
            userInput={userInput}
            emotion={selectedEmotion}
            mainNote={mainNote}
            subNotes={subNotes}
            onComplete={(nextThought, nextSummary) => {
              setAutoThought(nextThought);
              setSummary(nextSummary);
              setStep("errors");
            }}
          />
        )}

        {step === "errors" && (
          <DeepCognitiveErrorSection
            userInput={userInput}
            thought={autoThought}
            summary={summary}
            onSelect={handleSelectErrors}
          />
        )}

        {step === "alternative" && (
          <DeepAlternativeThoughtSection
            userInput={userInput}
            emotion={selectedEmotion}
            autoThought={autoThought}
            summary={summary}
            selectedCognitiveErrors={selectedCognitiveErrors}
            previousAlternatives={previousAlternatives}
            seed={alternativeSeed}
            onSelect={handleComplete}
          />
        )}
      </div>
    </div>
  );
}

export default function DeepSessionPage() {
  return (
    <CbtToastProvider>
      <DeepSessionPageContent />
    </CbtToastProvider>
  );
}
