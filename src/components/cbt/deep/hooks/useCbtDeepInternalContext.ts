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
  const uniqueSorted = Array.from(new Set(ids)).sort((a, b) => a - b);
  return uniqueSorted.join("|");
};

export function useCbtDeepInternalContext(
  mainNote: EmotionNote | null,
  subNotes: EmotionNote[],
  options?: { enabled?: boolean },
) {
  const key = useMemo(() => buildKey(mainNote, subNotes), [mainNote, subNotes]);
  const enabled = options?.enabled ?? true;

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
    enabled: Boolean(enabled && key && mainNote),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
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
