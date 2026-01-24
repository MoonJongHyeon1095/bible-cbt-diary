"use client";

import { useCallback, useMemo } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type UseEmotionNoteAccessOptions = {
  noteId?: number | null;
  setError: (message: string) => void;
};

export default function useEmotionNoteAccess({
  noteId,
  setError,
}: UseEmotionNoteAccessOptions) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  const getAccessToken = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }, [supabase]);

  const requireAccessToken = useCallback(
    async (messageText = "로그인이 필요합니다.") => {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        setError(messageText);
        return null;
      }
      return accessToken;
    },
    [getAccessToken, setError],
  );

  const ensureNoteId = useCallback(() => {
    if (!noteId) {
      setError("먼저 기록을 저장해주세요.");
      return null;
    }
    return noteId;
  }, [noteId, setError]);

  return {
    supabase,
    getAccessToken,
    requireAccessToken,
    ensureNoteId,
  };
}
