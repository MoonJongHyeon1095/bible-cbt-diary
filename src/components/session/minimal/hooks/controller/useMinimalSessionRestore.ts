import {
  clearSessionResumeRestoreDraft,
  readSessionResumeRestoreDraft,
} from "@/components/restore/storage";
import type { SessionResumeDraft } from "@/components/restore/types";
import { useEffect, useRef, useState } from "react";

type MinimalFlowActions = {
  setSelectedEmotion: (value: string) => void;
  setUserInput: (value: string) => void;
  setStep: (step: "incident") => void;
};

type UseMinimalSessionRestoreParams = {
  actions: MinimalFlowActions;
};

export function useMinimalSessionRestore({ actions }: UseMinimalSessionRestoreParams) {
  const restoreAppliedRef = useRef(false);
  const [pendingRestoreDraft] = useState<SessionResumeDraft | null>(
    () => readSessionResumeRestoreDraft(),
  );
  const pendingRestoreDraftRef = useRef<SessionResumeDraft | null>(pendingRestoreDraft);

  useEffect(() => {
    if (restoreAppliedRef.current) return;
    restoreAppliedRef.current = true;

    const restoreDraft = pendingRestoreDraftRef.current;
    if (!restoreDraft || restoreDraft.kind !== "minimal") return;

    actions.setSelectedEmotion(restoreDraft.selectedEmotion);
    actions.setUserInput(restoreDraft.incident);
    actions.setStep("incident");
    pendingRestoreDraftRef.current = null;
    clearSessionResumeRestoreDraft();
  }, [actions]);
}
