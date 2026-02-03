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
import { useAccessContext } from "@/lib/hooks/useAccessContext";
import type { SelectedCognitiveError } from "@/lib/types/cbtTypes";
import type { EmotionNote } from "@/lib/types/emotionNoteTypes";
import { flushTokenSessionUsage } from "@/lib/utils/tokenSessionStorage";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { startPerf } from "@/lib/utils/perf";
import { CbtDeepAutoThoughtSection } from "./center/CbtDeepAutoThoughtSection";
import { CbtDeepIncidentSection } from "./center/CbtDeepIncidentSection";
import { CbtDeepSelectSection } from "./center/CbtDeepSelectSection";
import { useCbtDeepInternalContext } from "./hooks/useCbtDeepInternalContext";
import { CbtDeepCognitiveErrorSection } from "./left/CbtDeepCognitiveErrorSection";
import { CbtDeepAlternativeThoughtSection } from "./right/CbtDeepAlternativeThoughtSection";
import { useGate } from "@/components/notice/GateProvider";

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

const TOUR_STORAGE_PREFIX = "deep-session-onboarding";

type TourProgress = {
  lastStep: number;
  lastTotal: number;
};

const Tour = dynamic(() => import("@reactour/tour").then((mod) => mod.Tour), {
  ssr: false,
});

function CbtDeepSessionPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { pushToast } = useCbtToast();
  const { accessMode: accessStateMode, isLoading: isAccessLoading } =
    useAccessContext();
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
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [disabledActions, setDisabledActions] = useState(false);
  const { blocker, canShowOnboarding } = useGate();
  const lastErrorsKeyRef = useRef<string>("");

  const stepOrder: DeepStep[] = shouldSelectSubNotes
    ? ["select", "incident", "emotion", "thought", "errors", "alternative"]
    : ["incident", "emotion", "thought", "errors", "alternative"];
  const currentStepIndex = stepOrder.indexOf(step);

  const tourSteps = useMemo(() => {
    if (step === "select") {
      return [
        {
          selector: "[data-tour='deep-select-main']",
          content: "핵심이 되는 메인 기록이에요.",
        },
        {
          selector: "[data-tour='deep-select-list']",
          content: "연결할 기록을 1~2개 골라주세요.",
        },
        {
          selector: "[data-tour='deep-select-next']",
          content: "이 조합으로 심화 세션을 시작해요.",
        },
      ];
    }
    if (step === "incident") {
      return [
        {
          selector: "[data-tour='deep-incident-input']",
          content: "이번엔 더 차분히 상황을 다시 적어봐요.",
        },
      ];
    }
    return [];
  }, [step]);

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

  useEffect(() => {
    if (blocker && isTourOpen) {
      setIsTourOpen(false);
    }
  }, [blocker, isTourOpen]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isAccessLoading) return;
    if (accessStateMode !== "auth") return;
    if (!canShowOnboarding) return;
    if (isTourOpen) return;
    if (tourSteps.length === 0) return;
    const storageKey = `${TOUR_STORAGE_PREFIX}:${step}`;
    const stored = window.localStorage.getItem(storageKey);
    const maxStepIndex = tourSteps.length - 1;
    let progress: TourProgress | null = null;
    if (stored) {
      try {
        progress = JSON.parse(stored) as TourProgress;
      } catch {
        progress = null;
      }
    }

    if (!progress) {
      setTourStep(0);
      setIsTourOpen(true);
      return;
    }

    if (tourSteps.length > progress.lastTotal) {
      const nextStep = Math.max(
        0,
        Math.min(progress.lastStep + 1, maxStepIndex),
      );
      setTourStep(nextStep);
      setIsTourOpen(true);
    }
  }, [
    isAccessLoading,
    accessStateMode,
    isTourOpen,
    canShowOnboarding,
    step,
    tourSteps.length,
  ]);

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
      const endPerf = startPerf(`deep:loadNotes:${loadKey}`);
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
            { includeMiddles: false },
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
        endPerf();
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
            subNotes={subNotes}
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
      {isTourOpen ? (
        <Tour
          steps={tourSteps}
          isOpen={isTourOpen}
          setIsOpen={setIsTourOpen}
          currentStep={tourStep}
          setCurrentStep={setTourStep}
          disabledActions={disabledActions}
          setDisabledActions={setDisabledActions}
          showCloseButton
          components={{
            Close: ({ onClick }) => (
              <button
                type="button"
                onClick={onClick}
                aria-label="온보딩 닫기"
                style={{
                  position: "absolute",
                  top: -10,
                  right: 10,
                  padding: "4px 10px",
                  fontSize: 12,
                  fontWeight: 700,
                  borderRadius: 999,
                  background: "rgba(22, 26, 33, 0.96)",
                  color: "#ffffff",
                  border: "1px solid rgba(255, 255, 255, 0.35)",
                  boxShadow: "0 8px 18px rgba(0,0,0,0.35)",
                  cursor: "pointer",
                }}
              >
                닫기
              </button>
            ),
          }}
          onClickClose={({ currentStep: stepIndex, setIsOpen }) => {
            if (typeof window !== "undefined") {
              const storageKey = `${TOUR_STORAGE_PREFIX}:${step}`;
              window.localStorage.setItem(
                storageKey,
                JSON.stringify({
                  lastStep: stepIndex,
                  lastTotal: tourSteps.length,
                }),
              );
            }
            setIsOpen(false);
          }}
          onClickMask={({ currentStep: stepIndex, setIsOpen }) => {
            if (typeof window !== "undefined") {
              const storageKey = `${TOUR_STORAGE_PREFIX}:${step}`;
              window.localStorage.setItem(
                storageKey,
                JSON.stringify({
                  lastStep: stepIndex,
                  lastTotal: tourSteps.length,
                }),
              );
            }
            setIsOpen(false);
          }}
          styles={{
            popover: (base) => ({
              ...base,
              borderRadius: 16,
              background: "rgba(22, 26, 33, 0.96)",
              color: "#e6e7ea",
              border: "1px solid rgba(143, 167, 200, 0.24)",
              boxShadow:
                "0 18px 40px rgba(8, 9, 12, 0.65), 0 0 0 1px rgba(255,255,255,0.04) inset",
              padding: "28px 18px 16px",
              overflow: "visible",
            }),
            close: (base) => ({
              ...base,
              color: "#ffffff",
              background: "rgba(22, 26, 33, 0.96)",
              borderRadius: 999,
              width: 26,
              height: 26,
              right: 10,
              top: -10,
              boxShadow: "0 8px 18px rgba(0,0,0,0.35)",
              border: "1px solid rgba(255, 255, 255, 0.35)",
              zIndex: 3,
              opacity: 1,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }),
            badge: (base) => ({
              ...base,
              background: "#f2c96d",
              color: "#0f1114",
              fontWeight: 700,
              boxShadow: "0 6px 16px rgba(0,0,0,0.35)",
            }),
            dot: (base, state) => ({
              ...base,
              width: 6,
              height: 6,
              margin: "0 4px",
              background: state?.current ? "#f2c96d" : "rgba(255,255,255,0.25)",
            }),
            arrow: (base) => ({
              ...base,
              color: "rgba(22, 26, 33, 0.96)",
            }),
            maskArea: (base) => ({
              ...base,
              rx: 16,
              ry: 16,
            }),
            highlightedArea: (base) => ({
              ...base,
              boxShadow: "0 0 0 9999px rgba(5, 7, 10, 0.7)",
              borderRadius: 16,
              border: "1px solid rgba(242, 201, 109, 0.55)",
            }),
            navigation: (base) => ({
              ...base,
              marginTop: 16,
            }),
            button: (base) => ({
              ...base,
              background: "rgba(143, 167, 200, 0.18)",
              color: "#e6e7ea",
              borderRadius: 999,
              padding: "6px 12px",
              fontWeight: 600,
              border: "1px solid rgba(143, 167, 200, 0.25)",
            }),
          }}
        />
      ) : null}
    </div>
  );
}

export default function CbtDeepSessionPage() {
  return <CbtDeepSessionPageContent />;
}
