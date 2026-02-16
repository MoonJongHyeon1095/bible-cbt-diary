import {
  clearSessionResumeRestoreDraft,
  readSessionResumeRestoreDraft,
} from "@/components/restore/storage";
import type { SessionResumeDraft } from "@/components/restore/types";
import { queryKeys } from "@/lib/queryKeys";
import type { DeepInternalContext } from "@/lib/gpt/deepContext";
import type { EmotionNote } from "@/lib/types/emotionNoteTypes";
import { useEffect, useRef, useState } from "react";

type DeepFlowActions = {
  setSelectedEmotions: (value: string[]) => void;
  setUserInput: (value: string) => void;
  setStep: (step: "incident") => void;
};

type QueryClientLike = {
  setQueryData: (queryKey: readonly unknown[], data: unknown) => void;
};

type UseDeepSessionRestoreParams = {
  notesLoading: boolean;
  mainNote: EmotionNote | null;
  flowId: number | null;
  subNotes: EmotionNote[];
  actions: DeepFlowActions;
  queryClient: QueryClientLike;
};

export function useDeepSessionRestore({
  notesLoading,
  mainNote,
  flowId,
  subNotes,
  actions,
  queryClient,
}: UseDeepSessionRestoreParams) {
  const [restoredInternalContext, setRestoredInternalContext] =
    useState<DeepInternalContext | null>(null);
  const restoreAppliedRef = useRef(false);
  const [pendingRestoreDraft] = useState<SessionResumeDraft | null>(
    () => readSessionResumeRestoreDraft(),
  );
  const pendingRestoreDraftRef = useRef<SessionResumeDraft | null>(pendingRestoreDraft);

  useEffect(() => {
    if (restoreAppliedRef.current) return;
    const restoreDraft = pendingRestoreDraftRef.current;
    if (!restoreDraft || restoreDraft.kind !== "deep") {
      restoreAppliedRef.current = true;
      return;
    }
    if (notesLoading || !mainNote || !flowId) return;

    const sameMain = restoreDraft.mainId === mainNote.id;
    const sameFlow = restoreDraft.flowId === flowId;
    const currentSubIds = subNotes.map((note) => note.id).sort((a, b) => a - b);
    const restoreSubIds = restoreDraft.subIds.slice().sort((a, b) => a - b);
    const sameSubs =
      currentSubIds.length === restoreSubIds.length &&
      currentSubIds.every((id, index) => id === restoreSubIds[index]);

    if (!sameMain || !sameFlow || !sameSubs) {
      pendingRestoreDraftRef.current = null;
      clearSessionResumeRestoreDraft();
      restoreAppliedRef.current = true;
      return;
    }

    actions.setSelectedEmotions(restoreDraft.selectedEmotions);
    actions.setUserInput(restoreDraft.incident);
    actions.setStep("incident");

    if (restoreDraft.internalContext) {
      setRestoredInternalContext(restoreDraft.internalContext);
      const contextKey = [restoreDraft.mainId, ...restoreDraft.subIds]
        .sort((a, b) => a - b)
        .join("|");
      queryClient.setQueryData(
        queryKeys.ai.deepInternalContext(contextKey),
        restoreDraft.internalContext,
      );
    }

    pendingRestoreDraftRef.current = null;
    clearSessionResumeRestoreDraft();
    restoreAppliedRef.current = true;
  }, [actions, flowId, mainNote, notesLoading, queryClient, subNotes]);

  return {
    restoredInternalContext,
    hasPendingDeepRestore: pendingRestoreDraftRef.current?.kind === "deep",
  };
}
