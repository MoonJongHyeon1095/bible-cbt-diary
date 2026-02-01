"use client";

import { useCbtToast } from "@/components/cbt/common/CbtToast";
import { useCbtAccess } from "@/components/cbt/hooks/useCbtAccess";
import { CbtMinimalEmotionSection } from "@/components/cbt/minimal/center/CbtMinimalEmotionSection";
import { CbtMinimalFloatingBackButton } from "@/components/cbt/minimal/common/CbtMinimalFloatingBackButton";
import { CbtMinimalFloatingHomeButton } from "@/components/cbt/minimal/common/CbtMinimalFloatingHomeButton";
import { CbtMinimalLoadingState } from "@/components/cbt/minimal/common/CbtMinimalLoadingState";
import { CbtMinimalSavingModal } from "@/components/cbt/minimal/common/CbtMinimalSavingModal";
import styles from "@/components/cbt/minimal/MinimalStyles.module.css";
import { saveDeepSessionAPI } from "@/components/cbt/utils/cbtSessionApi";
import { formatAutoTitle } from "@/components/cbt/utils/formatAutoTitle";
import { clearCbtSessionStorage } from "@/components/cbt/utils/storage/cbtSessionStorage";
import {
  fetchEmotionNoteGraph,
  fetchEmotionNoteById,
} from "@/components/graph/utils/emotionNoteGraphApi";
import type { SelectedCognitiveError } from "@/lib/types/cbtTypes";
import type { EmotionNote } from "@/lib/types/emotionNoteTypes";
import { flushTokenSessionUsage } from "@/lib/utils/tokenSessionStorage";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { CbtDeepAutoThoughtSection } from "./center/CbtDeepAutoThoughtSection";
import { CbtDeepIncidentSection } from "./center/CbtDeepIncidentSection";
import { CbtDeepSelectSection } from "./center/CbtDeepSelectSection";
import { useCbtDeepInternalContext } from "./hooks/useCbtDeepInternalContext";
import { CbtDeepCognitiveErrorSection } from "./left/CbtDeepCognitiveErrorSection";
import { CbtDeepAlternativeThoughtSection } from "./right/CbtDeepAlternativeThoughtSection";

const parseIds = (value: string | null) => {
  if (!value) return [] as number[];
  return value
    .split(",")
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item));
};

type DeepStep =
  | "select"
  | "incident"
  | "emotion"
  | "thought"
  | "errors"
  | "alternative";

function CbtDeepSessionPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { pushToast } = useCbtToast();
  const { accessMode, accessToken, requireAccessContext } = useCbtAccess({
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
  const hasSubIdsParam = Boolean(subIdsParam);
  const shouldSelectSubNotes = Boolean(groupId) && subIds.length === 0;

  const [notesLoading, setNotesLoading] = useState(true);
  const [notesError, setNotesError] = useState<string | null>(null);
  const [mainNote, setMainNote] = useState<EmotionNote | null>(null);
  const [subNotes, setSubNotes] = useState<EmotionNote[]>([]);
  const [groupNotes, setGroupNotes] = useState<EmotionNote[]>([]);
  const [selectedSubIds, setSelectedSubIds] = useState<number[]>([]);
  const requestIdRef = useRef(0);
  const lastLoadKeyRef = useRef("");
  const inFlightRef = useRef(false);
  const [step, setStep] = useState<DeepStep>(() =>
    shouldSelectSubNotes ? "select" : "incident"
  );
  const [userInput, setUserInput] = useState("");
  const [selectedEmotion, setSelectedEmotion] = useState("");
  const [autoThought, setAutoThought] = useState("");
  const [selectedCognitiveErrors, setSelectedCognitiveErrors] = useState<
    SelectedCognitiveError[]
  >([]);
  const [alternativeSeed, setAlternativeSeed] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const lastErrorsKeyRef = useRef<string>("");

  const stepOrder: DeepStep[] = shouldSelectSubNotes
    ? ["select", "incident", "emotion", "thought", "errors", "alternative"]
    : ["incident", "emotion", "thought", "errors", "alternative"];
  const currentStepIndex = stepOrder.indexOf(step);

  useEffect(() => {
    setSelectedSubIds([]);
    setStep(shouldSelectSubNotes ? "select" : "incident");
  }, [groupIdParam, mainIdParam, shouldSelectSubNotes]);

  useEffect(() => {
    const handlePageHide = () => {
      void flushTokenSessionUsage();
    };
    window.addEventListener("pagehide", handlePageHide);
    return () => {
      window.removeEventListener("pagehide", handlePageHide);
      void flushTokenSessionUsage();
    };
  }, []);

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

        if (groupId && hasSubIdsParam && (subIds.length < 1 || subIds.length > 2)) {
          setNotesError("subIds는 1~2개여야 합니다.");
          setNotesLoading(false);
          return;
        }

        if (accessMode !== "auth" || !accessToken || requestId !== requestIdRef.current) {
          return;
        }

        setNotesLoading(true);
        setNotesError(null);

        if (groupId) {
          const { response, data } = await fetchEmotionNoteGraph(
            accessToken,
            groupId,
          );
          if (requestId !== requestIdRef.current) return;
          if (!response.ok) {
            setNotesError("노트를 불러오지 못했습니다.");
            setNotesLoading(false);
            return;
          }
          const allNotes =
            data.notes?.slice().sort((a, b) => {
              const aTime = new Date(a.created_at).getTime();
              const bTime = new Date(b.created_at).getTime();
              return bTime - aTime;
            }) ?? [];
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
          setGroupNotes(allNotes);
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
        setGroupNotes([]);
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
    subIdSet,
    subIds.length,
    hasSubIdsParam,
    accessMode,
    accessToken,
  ]);

  const {
    context: internalContext,
    error: internalContextLoadError,
  } = useCbtDeepInternalContext(mainNote, subNotes);

  useEffect(() => {
    if (!internalContextLoadError) return;
    pushToast(internalContextLoadError, "error");
  }, [internalContextLoadError, pushToast]);

  const handleBack = () => {
    if (step === "select") {
      if (groupId && mainNote) {
        router.push(`/graph?groupId=${groupId}&noteId=${mainNote.id}`);
      }
      return;
    }
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
    const access = await requireAccessContext();
    if (!access) return;

    setIsSaving(true);

    try {
      const result = await saveDeepSessionAPI(access, {
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
      const resolvedGroupId = result.payload?.groupId ?? groupId;

      pushToast("세션 기록이 저장되었습니다.", "success");
      window.setTimeout(() => {
        void flushTokenSessionUsage({ sessionCount: 1 });
        clearCbtSessionStorage();
        if (resolvedGroupId) {
          router.push(`/graph?groupId=${resolvedGroupId}&noteId=${noteId}`);
        } else {
          router.push(`/detail?id=${noteId}`);
        }
      }, 180);
    } catch (error) {
      console.error("deep 세션 저장 실패:", error);
      pushToast("세션 기록을 저장하지 못했습니다.", "error");
      setIsSaving(false);
    }
  };

  const selectableNotes = useMemo(() => {
    if (!groupId) return [];
    return groupNotes.filter((note) => note.id !== mainNote?.id);
  }, [groupNotes, groupId, mainNote]);

  const toggleSelectSub = (id: number) => {
    setSelectedSubIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 2) {
        return prev;
      }
      return [...prev, id];
    });
  };

  const selectedCount = selectedSubIds.length;
  const canConfirmSelection = selectedCount >= 1;

  const handleConfirmSelection = () => {
    if (!canConfirmSelection) return;
    const selectedNotes = groupNotes
      .filter((note) => selectedSubIds.includes(note.id))
      .sort((a, b) => b.id - a.id);
    setSubNotes(selectedNotes);
    setStep("incident");
  };

  if (notesLoading) {
    return (
      <CbtMinimalLoadingState
        title="준비 중입니다"
        message="기록을 불러오고 있어요."
        variant="page"
      />
    );
  }

  if (notesError || !mainNote) {
    return (
      <CbtMinimalLoadingState
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
        <CbtMinimalSavingModal open={isSaving} />
        {(currentStepIndex > 0 || step === "select") && (
          <div className={`${styles.floatingNav} ${styles.left}`}>
            <CbtMinimalFloatingBackButton onClick={handleBack} />
          </div>
        )}
        <div className={`${styles.floatingNav} ${styles.right}`}>
          <CbtMinimalFloatingHomeButton onClick={handleGoHome} />
        </div>

        {step === "incident" && (
          <CbtDeepIncidentSection
            userInput={userInput}
            onInputChange={setUserInput}
            onNext={() => setStep("emotion")}
            mainNote={mainNote}
          />
        )}

        {step === "select" && mainNote && (
          <CbtDeepSelectSection
            mainNote={mainNote}
            selectableNotes={selectableNotes}
            selectedSubIds={selectedSubIds}
            selectedCount={selectedCount}
            onToggleSub={toggleSelectSub}
            onConfirm={handleConfirmSelection}
            canConfirm={canConfirmSelection}
          />
        )}

        {step === "emotion" && (
          <CbtMinimalEmotionSection
            selectedEmotion={selectedEmotion}
            onSelectEmotion={setSelectedEmotion}
            onNext={() => setStep("thought")}
          />
        )}

        {step === "thought" && (
          <CbtDeepAutoThoughtSection
            userInput={userInput}
            emotion={selectedEmotion}
            mainNote={mainNote}
            subNotes={subNotes}
            internalContext={internalContext}
            onComplete={(nextThought) => {
              setAutoThought(nextThought);
              setStep("errors");
            }}
          />
        )}

        {step === "errors" && (
          <CbtDeepCognitiveErrorSection
            userInput={userInput}
            thought={autoThought}
            internalContext={internalContext}
            onSelect={handleSelectErrors}
          />
        )}

        {step === "alternative" && (
          <CbtDeepAlternativeThoughtSection
            userInput={userInput}
            emotion={selectedEmotion}
            autoThought={autoThought}
            internalContext={internalContext}
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

export default function CbtDeepSessionPage() {
  return <CbtDeepSessionPageContent />;
}
