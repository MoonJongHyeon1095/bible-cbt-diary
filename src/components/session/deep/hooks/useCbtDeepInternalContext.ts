import { createDeepInternalContext } from "@/lib/ai";
import type { DeepInternalContext } from "@/lib/gpt/deepContext";
import { buildDeepNoteContext } from "@/lib/gpt/deepThought.types";
import { queryKeys } from "@/lib/queryKeys";
import type { EmotionNote } from "@/lib/types/emotionNoteTypes";
import { startPerf } from "@/lib/utils/perf";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

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
  const isDev = process.env.NODE_ENV !== "production";

  const query = useQuery({
    queryKey: queryKeys.ai.deepInternalContext(key),
    queryFn: async () => {
      if (!mainNote) {
        return null as DeepInternalContext | null;
      }
      if (isDev) {
        console.info("[deep/internal-context] query:start", {
          key,
          mainNoteId: mainNote.id,
          subNoteIds: subNotes.map((note) => note.id),
          enabled,
        });
      }
      const endPerf = startPerf(`deep:internalContext:${key}`);
      try {
        const mainContext = buildDeepNoteContext(mainNote);
        const subContexts = subNotes.map(buildDeepNoteContext);
        const result = await createDeepInternalContext(mainContext, subContexts);
        if (isDev) {
          console.info("[deep/internal-context] query:success", {
            key,
            hasResult: Boolean(result),
          });
        }
        return result;
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
