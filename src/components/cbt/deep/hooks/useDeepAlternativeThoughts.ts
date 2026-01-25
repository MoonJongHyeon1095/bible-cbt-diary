import { useCallback, useEffect, useRef, useState } from "react";
import { generateDeepAlternativeThoughts } from "@/lib/ai";
import { AlternativeThought } from "@/lib/gpt/alternative";
import type { SelectedCognitiveError } from "@/lib/cbtTypes";

const alternativeThoughtsCache = new Map<string, AlternativeThought[]>();

type UseDeepAlternativeThoughtsParams = {
  step: number;
  userInput: string;
  emotion: string;
  autoThought: string;
  summary: string;
  selectedCognitiveErrors: SelectedCognitiveError[];
  previousAlternatives: string[];
};

export function useDeepAlternativeThoughts({
  step,
  userInput,
  emotion,
  autoThought,
  summary,
  selectedCognitiveErrors,
  previousAlternatives,
}: UseDeepAlternativeThoughtsParams) {
  const [alternativeThoughts, setAlternativeThoughts] = useState<
    AlternativeThought[]
  >([]);
  const [thoughtsLoading, setThoughtsLoading] = useState(false);
  const [thoughtsError, setThoughtsError] = useState<string | null>(null);
  const inFlightRef = useRef(false);

  const requestKey = JSON.stringify({
    userInput,
    emotion,
    autoThought,
    summary,
    selectedCognitiveErrors,
    previousAlternatives,
  });

  const generateAlternatives = useCallback(
    async (options?: { force?: boolean }) => {
      if (inFlightRef.current) return;
      const cached = alternativeThoughtsCache.get(requestKey);
      if (!options?.force && cached) {
        setAlternativeThoughts(cached);
        setThoughtsError(null);
        setThoughtsLoading(false);
        return;
      }

      inFlightRef.current = true;
      setThoughtsLoading(true);
      setThoughtsError(null);

      try {
        const thoughts = await generateDeepAlternativeThoughts(
          userInput,
          emotion,
          autoThought,
          summary,
          selectedCognitiveErrors,
          previousAlternatives,
        );

        alternativeThoughtsCache.set(requestKey, thoughts);
        setAlternativeThoughts(thoughts);
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
      previousAlternatives,
      requestKey,
      selectedCognitiveErrors,
      summary,
      userInput,
    ],
  );

  useEffect(() => {
    if (
      step === 4 &&
      alternativeThoughts.length === 0 &&
      !thoughtsLoading &&
      autoThought.trim()
    ) {
      void generateAlternatives();
    }
  }, [alternativeThoughts.length, autoThought, generateAlternatives, step, thoughtsLoading]);

  return {
    alternativeThoughts,
    thoughtsLoading,
    thoughtsError,
    generateAlternatives,
  };
}
