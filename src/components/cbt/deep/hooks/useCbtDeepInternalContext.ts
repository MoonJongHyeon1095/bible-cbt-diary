import { useMemo } from "react";
import { createDeepInternalContext } from "@/lib/ai";
import { buildDeepNoteContext } from "@/lib/gpt/deepThought.types";
import type { EmotionNote } from "@/lib/types/emotionNoteTypes";
import type { DeepInternalContext } from "@/lib/gpt/deepContext";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { startPerf } from "@/lib/utils/perf";

const buildKey = (mainNote: EmotionNote | null, subNotes: EmotionNote[]) => {
  if (!mainNote) return "";
  const ids = [mainNote.id, ...subNotes.map((note) => note.id)];
  return ids.join("|");
};

export function useCbtDeepInternalContext(
  mainNote: EmotionNote | null,
  subNotes: EmotionNote[],
) {
  const key = useMemo(() => buildKey(mainNote, subNotes), [mainNote, subNotes]);

  const query = useQuery({
    queryKey: queryKeys.ai.deepInternalContext(key),
    queryFn: async () => {
      if (!mainNote) {
        return null as DeepInternalContext | null;
      }
      const endPerf = startPerf(`deep:internalContext:${key}`);
      try {
        const mainContext = buildDeepNoteContext(mainNote);
        const subContexts = subNotes.map(buildDeepNoteContext);
        return createDeepInternalContext(mainContext, subContexts);
      } finally {
        endPerf();
      }
    },
    enabled: Boolean(key && mainNote),
  });

  return {
    context: query.data ?? null,
    error: query.isError
      ? query.error instanceof Error
        ? query.error.message
        : "오류가 발생했습니다."
      : null,
    loading: query.isPending || query.isFetching,
  };
}
