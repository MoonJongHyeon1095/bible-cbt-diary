import { createDeepMontageScenario } from "@/lib/ai";
import type { DeepMontageScenario } from "@/lib/gpt/deepMontageScenario";
import { buildDeepNoteContext } from "@/lib/gpt/deepThought.types";
import { queryKeys } from "@/lib/queryKeys";
import type { EmotionNote } from "@/lib/types/emotionNoteTypes";
import { startPerf } from "@/lib/utils/perf";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

const buildKey = (mainNote: EmotionNote | null, subNotes: EmotionNote[]) => {
  if (!mainNote) return "";
  const ids = [mainNote.id, ...subNotes.map((note) => note.id)];
  const uniqueSorted = Array.from(new Set(ids)).sort((a, b) => a - b);
  return uniqueSorted.join("|");
};

export function useCbtDeepMontageScenario(
  mainNote: EmotionNote | null,
  subNotes: EmotionNote[],
  options?: { enabled?: boolean },
) {
  const key = useMemo(() => buildKey(mainNote, subNotes), [mainNote, subNotes]);
  const enabled = options?.enabled ?? true;

  const query = useQuery({
    queryKey: queryKeys.ai.deepMontageScenario(key),
    queryFn: async () => {
      if (!mainNote) {
        return null as DeepMontageScenario | null;
      }
      const endPerf = startPerf(`deep:montageScenario:${key}`);
      try {
        const mainContext = buildDeepNoteContext(mainNote);
        const subContexts = subNotes.map(buildDeepNoteContext);
        console.log("deepMontage mainContext", mainContext);
        console.log("deepMontage subContexts", subContexts);
        return createDeepMontageScenario(mainContext, subContexts);
      } finally {
        endPerf();
      }
    },
    enabled: Boolean(enabled && key && mainNote),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  return {
    key,
    scenario: query.data ?? null,
    error: query.isError
      ? query.error instanceof Error
        ? query.error.message
        : "오류가 발생했습니다."
      : null,
    loading: query.isPending || query.isFetching,
  };
}
