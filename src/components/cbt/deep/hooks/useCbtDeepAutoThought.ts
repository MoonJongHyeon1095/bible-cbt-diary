import { generateDeepAutoThoughts } from "@/lib/ai";
import type { DeepInternalContext } from "@/lib/gpt/deepContext";
import type { DeepAutoThoughtResult } from "@/lib/gpt/deepThought";
import { buildDeepNoteContext } from "@/lib/gpt/deepThought.types";
import type { EmotionNote } from "@/lib/types/emotionNoteTypes";
import { isAiFallback } from "@/lib/utils/aiFallback";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";

const buildContext = (note: EmotionNote) => buildDeepNoteContext(note);

type UseDeepAutoThoughtParams = {
  userInput: string;
  emotion: string;
  mainNote: EmotionNote | null;
  subNotes: EmotionNote[];
  internalContext: DeepInternalContext | null;
};

export function useCbtDeepAutoThought({
  userInput,
  emotion,
  mainNote,
  subNotes,
  internalContext,
}: UseDeepAutoThoughtParams) {
  const requestKey = useMemo(() => {
    const ids = [mainNote?.id, ...subNotes.map((note) => note.id)].filter(
      Boolean,
    );
    return JSON.stringify({
      userInput: userInput.trim(),
      emotion: emotion.trim(),
      ids,
      internalContext: internalContext
        ? JSON.stringify(internalContext)
        : "pending",
    });
  }, [emotion, internalContext, mainNote?.id, subNotes, userInput]);

  const query = useQuery({
    queryKey: queryKeys.ai.deepAutoThought(requestKey),
    queryFn: async () => {
      if (!userInput.trim() || !emotion || !mainNote || !internalContext) {
        return null;
      }
      const mainContext = buildContext(mainNote);
      const subContexts = subNotes.map(buildContext);
      // 이 로그 지우지 마 절대
      console.log("[deep] auto-thought context", internalContext);
      const sdt = await generateDeepAutoThoughts(
        userInput,
        emotion,
        mainContext,
        subContexts,
        internalContext,
      );
      const nextItems = [
        {
          belief: sdt.sdt.relatedness.belief.filter(Boolean).join(" ").trim(),
          emotionReason: sdt.sdt.relatedness.emotion_reason,
        },
        {
          belief: sdt.sdt.competence.belief.filter(Boolean).join(" ").trim(),
          emotionReason: sdt.sdt.competence.emotion_reason,
        },
        {
          belief: sdt.sdt.autonomy.belief.filter(Boolean).join(" ").trim(),
          emotionReason: sdt.sdt.autonomy.emotion_reason,
        },
      ];
      const nextAutoThought = nextItems.map((item) => item.belief).join(" ");
      return {
        items: nextItems,
        autoThought: nextAutoThought,
        result: sdt,
        isFallback: isAiFallback(sdt),
      };
    },
    enabled:
      Boolean(userInput.trim()) &&
      Boolean(emotion) &&
      Boolean(mainNote) &&
      Boolean(internalContext),
  });

  return {
    autoThought: query.data?.autoThought ?? "",
    items: query.data?.items ?? [],
    result: (query.data?.result ?? null) as DeepAutoThoughtResult | null,
    loading: query.isPending || query.isFetching,
    error: query.isError
      ? query.error instanceof Error
        ? query.error.message
        : "오류가 발생했습니다."
      : null,
    isFallback: query.data?.isFallback ?? false,
    reload: async () => {
      await query.refetch();
    },
  };
}
