import { generateContextualAlternativeThoughts } from "@/lib/ai";
import { AlternativeThought } from "@/lib/gpt/alternative";
import type {
  EmotionThoughtPair,
  SelectedCognitiveError,
} from "@/lib/types/cbtTypes";
import { isAiFallback } from "@/lib/utils/aiFallback";
import { useCallback, useEffect, useRef, useState } from "react";

const alternativeThoughtsCache = new Map<
  string,
  { thoughts: AlternativeThought[]; isFallback: boolean }
>();

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
  const [alternativeThoughts, setAlternativeThoughts] = useState<
    AlternativeThought[]
  >([]);
  const [thoughtsLoading, setThoughtsLoading] = useState(false);
  const [thoughtsError, setThoughtsError] = useState<string | null>(null);
  const [isFallback, setIsFallback] = useState(false);
  const inFlightRef = useRef(false);

  const requestKey = JSON.stringify({
    userInput,
    emotionThoughtPairs,
    selectedCognitiveErrors,
  });

  const generateAlternatives = useCallback(
    async (options?: { force?: boolean }) => {
      if (inFlightRef.current) return;
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
        const emotions = emotionThoughtPairs.map((p) => p.emotion).join(", ");
        const firstPair = emotionThoughtPairs[0];
        const thoughts = await generateContextualAlternativeThoughts(
          userInput,
          emotions,
          firstPair?.thought ?? "",
          selectedCognitiveErrors,
        );

        const fallback = isAiFallback(thoughts);
        alternativeThoughtsCache.set(requestKey, { thoughts, isFallback: fallback });
        setAlternativeThoughts(thoughts);
        setIsFallback(fallback);
      } catch (err) {
        setThoughtsError(
          err instanceof Error ? err.message : "오류가 발생했습니다.",
        );
        console.error("대안사고 생성 오류:", err);
      } finally {
        inFlightRef.current = false;
        setThoughtsLoading(false);
      }
    },
    [emotionThoughtPairs, requestKey, selectedCognitiveErrors, userInput],
  );

  useEffect(() => {
    if (
      step === 4 &&
      alternativeThoughts.length === 0 &&
      !thoughtsLoading &&
      emotionThoughtPairs.length > 0
    ) {
      void generateAlternatives();
    }
  }, [
    alternativeThoughts.length,
    emotionThoughtPairs.length,
    generateAlternatives,
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
