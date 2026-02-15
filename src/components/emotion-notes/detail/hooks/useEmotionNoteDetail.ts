"use client";

import { fetchEmotionNote } from "@/lib/api/emotion-notes/getEmotionNote";
import { useAccessContext } from "@/lib/hooks/useAccessContext";
import type { AccessContext } from "@/lib/types/access";
import type { EmotionNoteWithDetails } from "@/lib/types/emotionNoteTypes";
import { queryKeys } from "@/lib/queryKeys";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

export default function useEmotionNoteDetail(noteId?: number | null) {
  const { accessMode, accessToken } = useAccessContext();

  const access = useMemo<AccessContext>(
    () => ({ mode: accessMode, accessToken }),
    [accessMode, accessToken],
  );

  const noteQuery = useQuery({
    queryKey:
      noteId && access.mode !== "blocked"
        ? queryKeys.emotionNotes.detail(access, noteId)
        : ["noop"],
    queryFn: async () => {
      if (!noteId) {
        return null;
      }
      const currentAccess = { mode: accessMode, accessToken };
      if (!currentAccess || currentAccess.mode === "blocked") {
        return null;
      }
      const { response, data } = await fetchEmotionNote(noteId, currentAccess);
      if (!response.ok || !data.note) {
        throw new Error("emotion_note fetch failed");
      }
      return data.note;
    },
    enabled: Boolean(noteId) && access.mode !== "blocked",
  });

  return {
    detailAccessMode: accessMode,
    note: (noteQuery.data ?? null) as EmotionNoteWithDetails | null,
    isLoading: noteQuery.isPending || noteQuery.isFetching,
    error: noteQuery.isError
      ? noteQuery.error instanceof Error
        ? noteQuery.error.message
        : "기록을 불러오지 못했습니다."
      : "",
  };
}
