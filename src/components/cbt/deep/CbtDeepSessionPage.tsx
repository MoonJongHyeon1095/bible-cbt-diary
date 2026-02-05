"use client";

import { useCbtToast } from "@/components/cbt/common/CbtToast";
import { useCbtAccess } from "@/components/cbt/hooks/useCbtAccess";
import { CbtMinimalEmotionSection } from "@/components/cbt/minimal/center/CbtMinimalEmotionSection";
import { CbtMinimalFloatingBackButton } from "@/components/cbt/minimal/common/CbtMinimalFloatingBackButton";
import { CbtMinimalFloatingHomeButton } from "@/components/cbt/minimal/common/CbtMinimalFloatingHomeButton";
import { CbtMinimalLoadingState } from "@/components/cbt/minimal/common/CbtMinimalLoadingState";
import { CbtMinimalSavingModal } from "@/components/cbt/minimal/common/CbtMinimalSavingModal";
import styles from "@/components/cbt/minimal/MinimalStyles.module.css";
import { saveDeepSessionAPI } from "@/lib/api/cbt/postDeepSession";
import { formatAutoTitle } from "@/components/cbt/utils/formatAutoTitle";
import { clearCbtSessionStorage } from "@/components/cbt/utils/storage/cbtSessionStorage";
import {
  fetchEmotionNoteGraph,
  fetchEmotionNoteById,
} from "@/lib/api/graph/getEmotionNoteGraph";
import { useAccessContext } from "@/lib/hooks/useAccessContext";
import type { SelectedCognitiveError } from "@/lib/types/cbtTypes";
import type { EmotionNote } from "@/lib/types/emotionNoteTypes";
import { safeLocalStorage } from "@/lib/utils/safeStorage";
import { flushTokenSessionUsage } from "@/lib/utils/tokenSessionStorage";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { Check } from "lucide-react";
import { queryKeys } from "@/lib/queryKeys";
import { CbtDeepAutoThoughtSection } from "./center/CbtDeepAutoThoughtSection";
import { CbtDeepIncidentSection } from "./center/CbtDeepIncidentSection";
import { CbtDeepSelectSection } from "./center/CbtDeepSelectSection";
import { useCbtDeepInternalContext } from "./hooks/useCbtDeepInternalContext";
import { CbtDeepCognitiveErrorSection } from "./left/CbtDeepCognitiveErrorSection";
import { CbtDeepAlternativeThoughtSection } from "./right/CbtDeepAlternativeThoughtSection";
import { useGate } from "@/components/gate/GateProvider";
import {
  useCbtDeepSessionFlow,
  type DeepStep,
} from "@/components/cbt/hooks/useCbtDeepSessionFlow";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const parseIds = (value: string | null) => {
  if (!value) return [] as number[];
  return value
    .split(",")
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item));
};

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
  const queryClient = useQueryClient();

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
  const { state: flow, actions } = useCbtDeepSessionFlow(
    shouldSelectSubNotes ? "select" : "incident",
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [disabledActions, setDisabledActions] = useState(false);
  const { blocker, canShowOnboarding } = useGate();
  const lastErrorsKeyRef = useRef<string>("");

  const stepOrder: DeepStep[] = shouldSelectSubNotes
    ? ["select", "incident", "emotion", "thought", "errors", "alternative"]
    : ["incident", "emotion", "thought", "errors", "alternative"];
  const currentStepIndex = stepOrder.indexOf(flow.step);

  const saveDeepMutation = useMutation({
    mutationFn: async (args: {
      access: { mode: "auth" | "guest" | "blocked"; accessToken: string | null };
      payload: {
        title: string;
        trigger_text: string;
        emotion: string;
        automatic_thought: string;
        selected_cognitive_error: SelectedCognitiveError | null;
        selected_alternative_thought: string;
        main_id: number;
        sub_ids: number[];
        group_id: number | null;
      };
    }) => saveDeepSessionAPI(args.access, args.payload),
  });

  const tourSteps = useMemo(() => {
    if (flow.step === "select") {
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
    if (flow.step === "incident") {
      return [
        {
          selector: "[data-tour='deep-incident-input']",
          content: "이번엔 더 차분히 상황을 다시 적어봐요.",
        },
      ];
    }
    if (flow.step === "emotion") {
      return [
        {
          selector: "[data-tour='emotion-grid']",
          content: "지금 가장 가까운 감정을 골라주세요.",
        },
      ];
    }
    return [];
  }, [flow.step]);

  useEffect(() => {
    setSelectedSubIds([]);
    actions.setStep(shouldSelectSubNotes ? "select" : "incident");
  }, [actions, groupIdParam, mainIdParam, shouldSelectSubNotes]);

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
    if (!safeLocalStorage.isAvailable()) return;
    if (isAccessLoading) return;
    if (accessStateMode !== "auth") return;
    if (!canShowOnboarding) return;
    if (isTourOpen) return;
    if (tourSteps.length === 0) return;
    const storageKey = `${TOUR_STORAGE_PREFIX}:${flow.step}`;
    const stored = safeLocalStorage.getItem(storageKey);
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
    flow.step,
    tourSteps.length,
  ]);

  const previousAlternatives = useMemo(() => {
    const notes = mainNote ? [mainNote, ...subNotes] : subNotes;
    const alternatives = notes.flatMap((note) =>
      (note.alternative_details ?? []).map((detail) => detail.alternative),
    );
    return alternatives.filter(Boolean);
  }, [mainNote, subNotes]);

  const hasValidMainId = Number.isFinite(mainId) && !Number.isNaN(mainId);
  const invalidGroupId = Boolean(groupIdParam && groupId === null);
  const invalidSubIds = Boolean(
    groupId && hasSubIdsParam && (subIds.length < 1 || subIds.length > 2),
  );

  const graphQuery = useQuery({
    queryKey:
      groupId && accessMode === "auth" && accessToken
        ? queryKeys.graph.group(accessToken, groupId, false)
        : ["noop"],
    queryFn: async () => {
      const { response, data } = await fetchEmotionNoteGraph(
        accessToken!,
        groupId as number,
        { includeMiddles: false },
      );
      if (!response.ok) {
        throw new Error("emotion_note_graph fetch failed");
      }
      return data.notes ?? [];
    },
    enabled:
      Boolean(groupId) &&
      accessMode === "auth" &&
      Boolean(accessToken) &&
      hasValidMainId &&
      !invalidGroupId &&
      !invalidSubIds,
  });

  const noteQuery = useQuery({
    queryKey:
      !groupId && accessMode === "auth" && accessToken && hasValidMainId
        ? queryKeys.graph.note(accessToken, mainId)
        : ["noop"],
    queryFn: async () => {
      const { response, data } = await fetchEmotionNoteById(
        accessToken!,
        mainId,
      );
      if (!response.ok || !data.note) {
        throw new Error("emotion_note fetch failed");
      }
      return data.note;
    },
    enabled:
      !groupId &&
      accessMode === "auth" &&
      Boolean(accessToken) &&
      hasValidMainId &&
      !invalidGroupId,
  });

  useEffect(() => {
    if (!hasValidMainId) {
      setNotesError("mainId가 필요합니다.");
      setNotesLoading(false);
      return;
    }

    if (invalidGroupId) {
      setNotesError("groupId가 올바르지 않습니다.");
      setNotesLoading(false);
      return;
    }

    if (invalidSubIds) {
      setNotesError("subIds는 1~2개여야 합니다.");
      setNotesLoading(false);
      return;
    }

    if (accessMode !== "auth" || !accessToken) {
      return;
    }

    if (groupId) {
      setNotesLoading(graphQuery.isPending || graphQuery.isFetching);
      if (graphQuery.isError) {
        setNotesError("노트를 불러오지 못했습니다.");
        return;
      }
      if (!graphQuery.data) return;
      const allNotes =
        graphQuery.data?.slice().sort((a, b) => {
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

      setNotesError(null);
      setMainNote(main);
      setSubNotes(subs);
      setGroupNotes(allNotes);
      setNotesLoading(false);
      return;
    }

    setNotesLoading(noteQuery.isPending || noteQuery.isFetching);
    if (noteQuery.isError) {
      setNotesError("노트를 불러오지 못했습니다.");
      setNotesLoading(false);
      return;
    }
    if (!noteQuery.data) return;
    setNotesError(null);
    setMainNote(noteQuery.data);
    setSubNotes([]);
    setGroupNotes([]);
    setNotesLoading(false);
  }, [
    accessMode,
    accessToken,
    graphQuery.data,
    graphQuery.isError,
    graphQuery.isFetching,
    graphQuery.isPending,
    groupId,
    hasValidMainId,
    invalidGroupId,
    invalidSubIds,
    mainId,
    noteQuery.data,
    noteQuery.isError,
    noteQuery.isFetching,
    noteQuery.isPending,
    subIdSet,
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
    if (flow.step === "select") {
      if (groupId && mainNote) {
        router.push(`/graph?groupId=${groupId}&noteId=${mainNote.id}`);
      }
      return;
    }
    if (currentStepIndex <= 0) return;
    actions.setStep(stepOrder[currentStepIndex - 1]);
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
    const seedBump = nextKey !== lastErrorsKeyRef.current;
    if (nextKey !== lastErrorsKeyRef.current) {
      lastErrorsKeyRef.current = nextKey;
    }
    actions.setErrors(errors, seedBump);
  };

  const handleComplete = async (thought: string) => {
    if (isSaving || !mainNote) return;
    const access = await requireAccessContext();
    if (!access) return;

    setIsSaving(true);

    try {
      const result = await saveDeepMutation.mutateAsync({
        access,
        payload: {
          title: formatAutoTitle(new Date(), flow.selectedEmotion),
          trigger_text: flow.userInput,
          emotion: flow.selectedEmotion,
          automatic_thought: flow.autoThought,
          selected_cognitive_error: flow.selectedCognitiveErrors[0] ?? null,
          selected_alternative_thought: thought,
          main_id: mainNote.id,
          sub_ids: subNotes.map((note) => note.id),
          group_id: groupId ?? null,
        },
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
      void queryClient.invalidateQueries({ queryKey: queryKeys.emotionNotes.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.sessionHistory.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.graph.all });
      window.setTimeout(() => {
        try {
          void flushTokenSessionUsage({ sessionCount: 1 });
          clearCbtSessionStorage();
          if (resolvedGroupId) {
            router.push(`/graph?groupId=${resolvedGroupId}&noteId=${noteId}`);
          } else {
            router.push(`/detail?id=${noteId}`);
          }
        } catch (timeoutError) {
          console.error("deep 세션 이동 실패:", timeoutError);
          pushToast("세션 이동 중 문제가 발생했습니다.", "error");
        } finally {
          setIsSaving(false);
        }
      }, 180);
    } catch (error) {
      console.error("deep 세션 저장 실패:", error);
      pushToast("세션 기록을 저장하지 못했습니다.", "error");
      setIsSaving(false);
    }
  };

  const persistTourProgress = (stepIndex: number) => {
    if (!safeLocalStorage.isAvailable()) return;
    const storageKey = `${TOUR_STORAGE_PREFIX}:${flow.step}`;
    safeLocalStorage.setItem(
      storageKey,
      JSON.stringify({
        lastStep: stepIndex,
        lastTotal: tourSteps.length,
      }),
    );
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
    actions.setStep("incident");
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
        {(currentStepIndex > 0 || flow.step === "select") && (
          <div className={`${styles.floatingNav} ${styles.left}`}>
            <CbtMinimalFloatingBackButton onClick={handleBack} />
          </div>
        )}
        <div className={`${styles.floatingNav} ${styles.right}`}>
          <CbtMinimalFloatingHomeButton onClick={handleGoHome} />
        </div>

        {flow.step === "incident" && (
          <CbtDeepIncidentSection
            userInput={flow.userInput}
            onInputChange={actions.setUserInput}
            onNext={() => actions.setStep("emotion")}
            mainNote={mainNote}
            subNotes={subNotes}
          />
        )}

        {flow.step === "select" && mainNote && (
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

        {flow.step === "emotion" && (
          <CbtMinimalEmotionSection
            selectedEmotion={flow.selectedEmotion}
            onSelectEmotion={actions.setSelectedEmotion}
            onNext={() => actions.setStep("thought")}
          />
        )}

        {flow.step === "thought" && (
          <CbtDeepAutoThoughtSection
            userInput={flow.userInput}
            emotion={flow.selectedEmotion}
            mainNote={mainNote}
            subNotes={subNotes}
            internalContext={internalContext}
            onComplete={(nextThought) => {
              actions.setAutoThought(nextThought);
            }}
          />
        )}

        {flow.step === "errors" && (
          <CbtDeepCognitiveErrorSection
            userInput={flow.userInput}
            thought={flow.autoThought}
            internalContext={internalContext}
            onSelect={handleSelectErrors}
          />
        )}

        {flow.step === "alternative" && (
          <CbtDeepAlternativeThoughtSection
            userInput={flow.userInput}
            emotion={flow.selectedEmotion}
            autoThought={flow.autoThought}
            internalContext={internalContext}
            selectedCognitiveErrors={flow.selectedCognitiveErrors}
            previousAlternatives={previousAlternatives}
            seed={flow.alternativeSeed}
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
          showCloseButton={false}
          nextButton={({
            Button,
            currentStep,
            setCurrentStep,
            setIsOpen,
            stepsLength,
          }) => {
            const lastStepIndex = Math.max(0, stepsLength - 1);
            const isLastStep = currentStep >= lastStepIndex;
            return (
              <Button
                kind="next"
                hideArrow={isLastStep}
                onClick={() => {
                  if (isLastStep) {
                    persistTourProgress(lastStepIndex);
                    setIsOpen(false);
                    return;
                  }
                  setCurrentStep(currentStep + 1);
                }}
              >
                {isLastStep ? <Check size={16} strokeWidth={2.4} /> : null}
              </Button>
            );
          }}
          onClickClose={({ currentStep: stepIndex, setIsOpen }) => {
            persistTourProgress(stepIndex);
            setIsOpen(false);
          }}
          onClickMask={({ currentStep: stepIndex, setIsOpen }) => {
            persistTourProgress(stepIndex);
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
