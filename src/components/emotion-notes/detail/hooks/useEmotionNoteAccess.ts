"use client";

import { useCallback } from "react";
import { useAccessContext } from "@/lib/hooks/useAccessContext";

type UseEmotionNoteAccessOptions = {
  noteId?: number | null;
  setError: (message: string) => void;
};

export default function useEmotionNoteAccess({
  noteId,
  setError,
}: UseEmotionNoteAccessOptions) {
  const { accessMode, accessToken, isBlocked } = useAccessContext();

  const getAccessContext = useCallback(
    async () => ({
      mode: accessMode,
      accessToken,
    }),
    [accessMode, accessToken],
  );

  const requireAccessContext = useCallback(
    async (messageText = "로그인이 필요합니다.") => {
      if (isBlocked) {
        setError(messageText);
        return null;
      }
      return {
        mode: accessMode,
        accessToken,
      };
    },
    [accessMode, accessToken, isBlocked, setError],
  );

  const ensureNoteId = useCallback(() => {
    if (!noteId) {
      setError("먼저 기록을 저장해주세요.");
      return null;
    }
    return noteId;
  }, [noteId, setError]);

  return {
    accessMode,
    accessToken,
    getAccessContext,
    requireAccessContext,
    ensureNoteId,
  };
}
