import { generateDeepAlternativeThoughts } from "@/lib/ai";
import { AlternativeThought } from "@/lib/gpt/alternative";
import type { DeepInternalContext } from "@/lib/gpt/deepContext";
import type { SelectedCognitiveError } from "@/lib/types/cbtTypes";
import { isAiFallback } from "@/lib/utils/aiFallback";
import { useCallback, useEffect, useRef, useState } from "react";

const alternativeThoughtsCache = new Map<
  string,
  { thoughts: AlternativeThought[]; isFallback: boolean }
>();

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
  const [alternativeThoughts, setAlternativeThoughts] = useState<
    AlternativeThought[]
  >([]);
  const [thoughtsLoading, setThoughtsLoading] = useState(false);
  const [thoughtsError, setThoughtsError] = useState<string | null>(null);
  const [isFallback, setIsFallback] = useState(false);
  const inFlightRef = useRef(false);

  const requestKey = JSON.stringify({
    userInput,
    emotion,
    autoThought,
    internalContext,
    selectedCognitiveErrors,
    previousAlternatives,
  });

  const generateAlternatives = useCallback(
    async (options?: { force?: boolean }) => {
      if (inFlightRef.current) return;
      if (!internalContext) return;
      const cached = alternativeThoughtsCache.get(requestKey);
      if (!options?.force && cached) {
        setAlternativeThoughts(cached.thoughts);
        setIsFallback(cached.isFallback);
        setThoughtsError(null);
        setThoughtsLoading(false);
        return;
      }

      inFlightRef.current = true;
      setThoughtsLoading(true);
      setThoughtsError(null);
      setIsFallback(false);

      try {
        const thoughts = await generateDeepAlternativeThoughts(
          userInput,
          emotion,
          autoThought,
          internalContext,
          selectedCognitiveErrors,
          previousAlternatives,
        );

        const fallback = isAiFallback(thoughts);
        alternativeThoughtsCache.set(requestKey, { thoughts, isFallback: fallback });
        setAlternativeThoughts(thoughts);
        setIsFallback(fallback);
      } catch (err) {
        setThoughtsError(
          err instanceof Error ? err.message : "오류가 발생했습니다.",
        );
        console.error("deep 대안사고 생성 오류:", err);
      } finally {
        inFlightRef.current = false;
        setThoughtsLoading(false);
      }
    },
    [
      autoThought,
      emotion,
      internalContext,
      previousAlternatives,
      requestKey,
      selectedCognitiveErrors,
      userInput,
    ],
  );

  useEffect(() => {
    if (
      step === 4 &&
      alternativeThoughts.length === 0 &&
      !thoughtsLoading &&
      autoThought.trim() &&
      internalContext
    ) {
      void generateAlternatives();
    }
  }, [
    alternativeThoughts.length,
    autoThought,
    generateAlternatives,
    internalContext,
    step,
    thoughtsLoading,
  ]);

  return {
    alternativeThoughts,
    thoughtsLoading,
    thoughtsError,
    isFallback,
    generateAlternatives,
  };
}
