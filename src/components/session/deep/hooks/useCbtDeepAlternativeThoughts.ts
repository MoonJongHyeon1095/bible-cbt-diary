import { generateDeepAlternativeThoughts } from "@/lib/ai";
import { AlternativeThought } from "@/lib/gpt/alternative";
import type { DeepInternalContext } from "@/lib/gpt/deepContext";
import type { SelectedCognitiveError } from "@/lib/types/sessionTypes";
import { isAiFallback } from "@/lib/utils/aiFallback";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";

type UseDeepAlternativeThoughtsParams = {
  step: number;
  userInput: string;
  emotion: string;
  autoThought: string;
  internalContext: DeepInternalContext | null;
  selectedCognitiveErrors: SelectedCognitiveError[];
  previousAlternatives: string[];
};

export function useCbtDeepAlternativeThoughts({
  step,
  userInput,
  emotion,
  autoThought,
  internalContext,
  selectedCognitiveErrors,
  previousAlternatives,
}: UseDeepAlternativeThoughtsParams) {
  const requestKey = useMemo(
    () =>
      JSON.stringify({
        userInput,
        emotion,
        autoThought,
        internalContext,
        selectedCognitiveErrors,
        previousAlternatives,
      }),
    [
      autoThought,
      emotion,
      internalContext,
      previousAlternatives,
      selectedCognitiveErrors,
      userInput,
    ],
  );

  const query = useQuery({
    queryKey: queryKeys.ai.deepAlternativeThoughts(requestKey),
    queryFn: async () => {
      if (!internalContext) {
        return { thoughts: [] as AlternativeThought[], isFallback: false };
      }
      const thoughts = await generateDeepAlternativeThoughts(
        userInput,
        emotion,
        autoThought,
        internalContext,
        selectedCognitiveErrors,
        previousAlternatives,
      );
      return { thoughts, isFallback: isAiFallback(thoughts) };
    },
    enabled:
      step === 4 &&
      Boolean(autoThought.trim()) &&
      Boolean(internalContext) &&
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
