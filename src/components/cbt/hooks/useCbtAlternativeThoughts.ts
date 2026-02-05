import { generateContextualAlternativeThoughts } from "@/lib/ai";
import type {
  EmotionThoughtPair,
  SelectedCognitiveError,
} from "@/lib/types/cbtTypes";
import { isAiFallback } from "@/lib/utils/aiFallback";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";

type UseAlternativeThoughtsParams = {
  step: number;
  userInput: string;
  emotionThoughtPairs: EmotionThoughtPair[];
  selectedCognitiveErrors: SelectedCognitiveError[];
};

export function useCbtAlternativeThoughts({
  step,
  userInput,
  emotionThoughtPairs,
  selectedCognitiveErrors,
}: UseAlternativeThoughtsParams) {
  const requestKey = useMemo(
    () =>
      JSON.stringify({
        userInput,
        emotionThoughtPairs,
        selectedCognitiveErrors,
      }),
    [emotionThoughtPairs, selectedCognitiveErrors, userInput],
  );

  const query = useQuery({
    queryKey: queryKeys.ai.alternativeThoughts(requestKey),
    queryFn: async () => {
      const emotions = emotionThoughtPairs.map((p) => p.emotion).join(", ");
      const firstPair = emotionThoughtPairs[0];
      const thoughts = await generateContextualAlternativeThoughts(
        userInput,
        emotions,
        firstPair?.thought ?? "",
        selectedCognitiveErrors,
      );
      return { thoughts, isFallback: isAiFallback(thoughts) };
    },
    enabled:
      step === 4 &&
      emotionThoughtPairs.length > 0 &&
      Boolean(userInput.trim()),
  });

  const alternativeThoughts = query.data?.thoughts ?? [];
  const isFallback = query.data?.isFallback ?? false;
  const thoughtsLoading = query.isPending || query.isFetching;
  const thoughtsError = query.isError
    ? query.error instanceof Error
      ? query.error.message
      : "오류가 발생했습니다."
    : null;

  const refetchRef = useRef(query.refetch);
  const dataRef = useRef(query.data);
  const loadingRef = useRef(thoughtsLoading);

  useEffect(() => {
    refetchRef.current = query.refetch;
    dataRef.current = query.data;
    loadingRef.current = thoughtsLoading;
  }, [query.refetch, query.data, thoughtsLoading]);

  const generateAlternatives = useCallback(async (options?: { force?: boolean }) => {
    if (options?.force) {
      await refetchRef.current();
      return;
    }
    if (!dataRef.current && !loadingRef.current) {
      await refetchRef.current();
    }
  }, []);

  return {
    alternativeThoughts,
    thoughtsLoading,
    thoughtsError,
    isFallback,
    generateAlternatives,
  };
}
