import {
  clearSessionResumeDraft,
  readSessionResumeDraft,
  stashSessionResumeRestoreDraft,
} from "@/components/restore/storage";
import type { SessionResumeDraft } from "@/components/restore/types";
import { useCallback, useEffect, useState } from "react";

type UseSessionResumeParams = {
  navigate: (path: string) => void;
};

export function useSessionResume({ navigate }: UseSessionResumeParams) {
  const [resumeDraft, setResumeDraft] = useState<SessionResumeDraft | null>(null);
  const [showResumeModal, setShowResumeModal] = useState(false);

  useEffect(() => {
    let timerId: number | null = null;
    const draft = readSessionResumeDraft();
    if (!draft) return;
    setResumeDraft(draft);
    timerId = window.setTimeout(() => {
      setShowResumeModal(true);
    }, 700);
    return () => {
      if (timerId !== null) {
        window.clearTimeout(timerId);
      }
    };
  }, []);

  const dismissResume = useCallback(() => {
    clearSessionResumeDraft();
    setShowResumeModal(false);
    setResumeDraft(null);
  }, []);

  const resume = useCallback(() => {
    if (!resumeDraft) return;
    stashSessionResumeRestoreDraft(resumeDraft);
    clearSessionResumeDraft();
    setShowResumeModal(false);
    setResumeDraft(null);

    const next = new URLSearchParams();
    if (resumeDraft.kind === "minimal" && resumeDraft.date) {
      next.set("date", resumeDraft.date);
    }
    navigate(`/session${next.toString() ? `?${next.toString()}` : ""}`);
  }, [navigate, resumeDraft]);

  return {
    showResumeModal,
    dismissResume,
    resume,
  };
}
