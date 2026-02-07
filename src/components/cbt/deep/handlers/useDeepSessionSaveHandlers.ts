import { useCallback, useRef } from "react";
import type { SelectedCognitiveError } from "@/lib/types/cbtTypes";
import type { EmotionNote } from "@/lib/types/emotionNoteTypes";
import type { DeepStep } from "@/components/cbt/hooks/useCbtDeepSessionFlow";
import { formatAutoTitle } from "@/components/cbt/utils/formatAutoTitle";
import { clearCbtSessionStorage } from "@/components/cbt/utils/storage/cbtSessionStorage";
import { queryKeys } from "@/lib/queryKeys";
import { flushTokenSessionUsage } from "@/lib/utils/tokenSessionStorage";

type AccessContext = {
  mode: "auth" | "guest" | "blocked";
  accessToken: string | null;
};

type SaveDeepResult = { ok: boolean; payload?: { noteId?: number; flowId?: number } };

type UseDeepSessionSaveHandlersParams = {
  flow: {
    step: DeepStep;
    userInput: string;
    selectedEmotion: string;
    autoThought: string;
    selectedCognitiveErrors: SelectedCognitiveError[];
  };
  flowId: number | null;
  mainNote: EmotionNote | null;
  subNotes: EmotionNote[];
  isSaving: boolean;
  setIsSaving: (next: boolean) => void;
  setAiEnabled: (next: boolean) => void;
  requireAccessContext: () => Promise<AccessContext | null>;
  saveDeep: (args: {
    access: AccessContext;
    payload: {
      title: string;
      trigger_text: string;
      emotion: string;
      automatic_thought: string;
      selected_cognitive_error: SelectedCognitiveError | null;
      selected_alternative_thought: string;
      main_id: number;
      sub_ids: number[];
      flow_id: number | null;
    };
  }) => Promise<SaveDeepResult>;
  queryClient: {
    invalidateQueries: (args: { queryKey: readonly unknown[] }) => Promise<unknown>;
  };
  router: { push: (path: string) => void };
  pushToast: (message: string, type: "success" | "error") => void;
  setErrors: (errors: SelectedCognitiveError[], seedBump: boolean) => void;
};

export function useDeepSessionSaveHandlers({
  flow,
  flowId,
  mainNote,
  subNotes,
  isSaving,
  setIsSaving,
  setAiEnabled,
  requireAccessContext,
  saveDeep,
  queryClient,
  router,
  pushToast,
  setErrors,
}: UseDeepSessionSaveHandlersParams) {
  const lastErrorsKeyRef = useRef<string>("");

  const handleSelectErrors = useCallback(
    (errors: SelectedCognitiveError[]) => {
      const nextKey = JSON.stringify(
        errors.map((item) => ({
          id: item.id,
          index: item.index,
          title: item.title,
          detail: item.detail,
        })),
      );
      const seedBump = nextKey !== lastErrorsKeyRef.current;
      if (seedBump) {
        lastErrorsKeyRef.current = nextKey;
      }
      setErrors(errors, seedBump);
    },
    [setErrors],
  );

  const handleComplete = useCallback(
    async (thought: string) => {
      if (isSaving || !mainNote) return;
      const access = await requireAccessContext();
      if (!access) return;

      setIsSaving(true);
      setAiEnabled(false);

      try {
        const result = await saveDeep({
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
            flow_id: flowId ?? null,
          },
        });

        if (!result.ok) {
          throw new Error("save_deep_session_failed");
        }

        const noteId = result.payload?.noteId;
        if (!noteId) {
          throw new Error("note_id_missing");
        }
        const resolvedFlowId = result.payload?.flowId ?? flowId;

        pushToast("세션 기록이 저장되었습니다.", "success");
        void queryClient.invalidateQueries({ queryKey: queryKeys.emotionNotes.all });
        void queryClient.invalidateQueries({ queryKey: queryKeys.sessionHistory.all });
        void queryClient.invalidateQueries({ queryKey: queryKeys.flow.all });
        window.setTimeout(() => {
          try {
            void flushTokenSessionUsage({ sessionCount: 1 });
            clearCbtSessionStorage();
            if (resolvedFlowId) {
              router.push(`/flow?flowId=${resolvedFlowId}&noteId=${noteId}`);
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
    },
    [
      flow.selectedEmotion,
      flow.userInput,
      flow.autoThought,
      flow.selectedCognitiveErrors,
      flowId,
      isSaving,
      mainNote,
      pushToast,
      queryClient,
      requireAccessContext,
      router,
      saveDeep,
      setAiEnabled,
      setIsSaving,
      subNotes,
    ],
  );

  return { handleSelectErrors, handleComplete };
}
