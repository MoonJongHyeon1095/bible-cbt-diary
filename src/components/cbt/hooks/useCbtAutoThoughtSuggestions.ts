import { useEffect, useMemo, useRef, useState } from "react";
import { generateExtendedAutomaticThoughts } from "@/lib/ai";
import { startPerf } from "@/lib/utils/perf";
import { isAiFallback } from "@/lib/utils/aiFallback";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";

type UseAutoThoughtSuggestionsParams = {
  userInput: string;
  emotion: string;
  onResetSelection: () => void;
};

export function useCbtAutoThoughtSuggestions({
  userInput,
  emotion,
  onResetSelection,
}: UseAutoThoughtSuggestionsParams) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasShownCustomPrompt, setHasShownCustomPrompt] = useState(false);
  const resetRef = useRef(onResetSelection);

  const cacheKey = useMemo(
    () => `${emotion}::${userInput.trim()}`,
    [emotion, userInput],
  );

  const query = useQuery({
    queryKey: queryKeys.ai.autoThoughtSuggestions(cacheKey),
    queryFn: async () => {
      const endPerf = startPerf(`ai:autoThoughts:${cacheKey}`);
      try {
        const result = await generateExtendedAutomaticThoughts(
          userInput,
          emotion,
        );
        const thoughts = result.sdtThoughts.map((item) => ({
          belief: item.belief,
          emotionReason: item.emotionReason,
        }));
        return {
          thoughts,
          isFallback: isAiFallback(result),
        };
      } finally {
        endPerf();
      }
    },
    enabled: Boolean(userInput.trim() && emotion),
  });

  const thoughts = useMemo(() => query.data?.thoughts ?? [], [query.data]);
  const isFallback = query.data?.isFallback ?? false;
  const loading = query.isPending || query.isFetching;
  const error = query.isError
    ? query.error instanceof Error
      ? query.error.message
      : "오류가 발생했습니다."
    : null;

  useEffect(() => {
    resetRef.current = onResetSelection;
  }, [onResetSelection]);

  useEffect(() => {
    setCurrentIndex(0);
    setHasShownCustomPrompt(false);
    resetRef.current();
  }, [cacheKey]);

  const currentThought = useMemo(() => {
    return thoughts[currentIndex] ?? null;
  }, [currentIndex, thoughts]);

  useEffect(() => {
    if (currentIndex >= 2) {
      setHasShownCustomPrompt(true);
    }
  }, [currentIndex]);

  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < thoughts.length - 1;

  const goPrevThought = () => {
    if (!canGoPrev) return;
    setCurrentIndex((prev) => prev - 1);
    onResetSelection();
  };

  const goNextThought = () => {
    if (!canGoNext) return;
    setCurrentIndex((prev) => prev + 1);
    onResetSelection();
  };

  const setIndex = (index: number) => {
    if (thoughts.length === 0) return;
    if (!Number.isFinite(index)) return;
    const nextIndex = Math.max(0, Math.min(index, thoughts.length - 1));
    setCurrentIndex(nextIndex);
    onResetSelection();
  };

  const reloadThoughts = async () => {
    await query.refetch();
  };

  return {
    thoughts,
    currentIndex,
    currentThought,
    loading,
    error,
    isFallback,
    shouldShowCustom: hasShownCustomPrompt,
    goNextThought,
    goPrevThought,
    setIndex,
    canGoPrev,
    canGoNext,
    reloadThoughts,
  };
}
