import { useCallback } from "react";
import type { SelectedCognitiveError } from "@/lib/types/sessionTypes";
import type { EmotionNote } from "@/lib/types/emotionNoteTypes";
import type { DeepStep } from "@/components/session/hooks/useCbtDeepSessionFlow";
import { buildSessionNoteTitle } from "@/components/session/utils/buildSessionNoteTitle";
import { runSessionSavePostProcess } from "@/components/session/hooks/useSessionSavePostProcess";
import { flowRoutes } from "@/components/flow/domain/navigation/flowRoutes";

type AccessContext = {
  mode: "auth" | "guest" | "blocked";
  accessToken: string | null;
};

type SaveDeepResult = { ok: boolean; payload?: { noteId?: number; flowId?: number } };

type UseDeepSessionSaveHandlersParams = {
  flow: {
    step: DeepStep;
    userInput: string;
    selectedEmotions: string[];
    noteTitle: string;
    autoThought: string;
    selectedCognitiveErrors: SelectedCognitiveError[];
  };
  flowId: number | null;
  mainNote: EmotionNote | null;
  subNotes: EmotionNote[];
  isSaving: boolean;
  setIsSaving: (next: boolean) => void;
  setAiEnabled: (next: boolean) => void;
  clearResumeDraft: () => void;
  requireAccessContext: () => Promise<AccessContext | null>;
  saveDeep: (args: {
    access: AccessContext;
    payload: {
      title: string;
      trigger_text: string;
      emotion: string;
      emotions?: string[];
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
  router: { push: (path: string) => void; replace: (path: string) => void };
  pushToast: (message: string, type: "success" | "error") => void;
};

export function useDeepSessionSaveHandlers({
  flow,
  flowId,
  mainNote,
  subNotes,
  isSaving,
  setIsSaving,
  setAiEnabled,
  clearResumeDraft,
  requireAccessContext,
  saveDeep,
  queryClient,
  router,
  pushToast,
}: UseDeepSessionSaveHandlersParams) {
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
            title:
              flow.noteTitle ||
              buildSessionNoteTitle({
                emotion: flow.selectedEmotions.join(", "),
                incident: flow.userInput,
              }),
            trigger_text: flow.userInput,
            emotion: flow.selectedEmotions.join(", "),
            emotions: flow.selectedEmotions,
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
        clearResumeDraft();
        const resolvedFlowId = result.payload?.flowId ?? flowId;

        const moved = await runSessionSavePostProcess({
          queryClient,
          router,
          nextPath: resolvedFlowId
            ? flowRoutes.byFlowAndNote(resolvedFlowId, noteId)
            : `/detail?id=${noteId}`,
          pushToast,
          includeFlowQuery: true,
        });
        if (!moved) {
          setIsSaving(false);
        }
      } catch (error) {
        console.error("deep 세션 저장 실패:", error);
        pushToast("세션 기록을 저장하지 못했습니다.", "error");
        setIsSaving(false);
      }
    },
    [
      flow.selectedEmotions,
      flow.noteTitle,
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
      clearResumeDraft,
      setIsSaving,
      subNotes,
    ],
  );

  return { handleComplete };
}
