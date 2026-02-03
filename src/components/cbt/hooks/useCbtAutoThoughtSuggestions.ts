import { useEffect, useMemo, useRef, useState } from "react";
import { generateExtendedAutomaticThoughts } from "@/lib/ai";
import {
  getAutoThoughtCache,
  setAutoThoughtCache,
} from "@/components/cbt/utils/storage/minimalAutoThoughtCache";
import { startPerf } from "@/lib/utils/perf";
import { isAiFallback } from "@/lib/utils/aiFallback";

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
  const [thoughts, setThoughts] = useState<
    Array<{ belief: string; emotionReason: string }>
  >([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasShownCustomPrompt, setHasShownCustomPrompt] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFallback, setIsFallback] = useState(false);
  const inFlightKeyRef = useRef<string | null>(null);

  const cacheKey = useMemo(
    () => `${emotion}::${userInput.trim()}`,
    [emotion, userInput],
  );

  const loadThoughts = async () => {
    if (!userInput.trim() || !emotion) return;
    if (inFlightKeyRef.current === cacheKey) return;
    inFlightKeyRef.current = cacheKey;
    const endPerf = startPerf(`ai:autoThoughts:${cacheKey}`);
    setLoading(true);
    setError(null);
    setIsFallback(false);
    onResetSelection();
    try {
      const result = await generateExtendedAutomaticThoughts(
        userInput,
        emotion,
      );
      setIsFallback(isAiFallback(result));
      const nextThoughts = result.sdtThoughts.map((item) => ({
        belief: item.belief,
        emotionReason: item.emotionReason,
      }));
      setThoughts(nextThoughts);
      setCurrentIndex(0);
      setHasShownCustomPrompt(false);
      setAutoThoughtCache(cacheKey, {
        thoughts: nextThoughts,
        index: 0,
        hasShownCustomPrompt: false,
        isFallback: isAiFallback(result),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      if (inFlightKeyRef.current === cacheKey) {
        inFlightKeyRef.current = null;
      }
      setLoading(false);
      endPerf();
    }
  };

  useEffect(() => {
    if (!userInput.trim() || !emotion) return;
    const cached = getAutoThoughtCache(cacheKey);
    if (cached) {
      setThoughts(cached.thoughts);
      setCurrentIndex(cached.index);
      setHasShownCustomPrompt(cached.hasShownCustomPrompt);
      setIsFallback(Boolean(cached.isFallback));
      setLoading(false);
      setError(null);
      return;
    }
    setHasShownCustomPrompt(false);
    void loadThoughts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey, emotion, userInput]);

  const currentThought = useMemo(() => {
    return thoughts[currentIndex] ?? null;
  }, [currentIndex, thoughts]);

  useEffect(() => {
    if (currentIndex >= 2) {
      setHasShownCustomPrompt(true);
    }
  }, [currentIndex]);

  useEffect(() => {
    if (!cacheKey || thoughts.length === 0) return;
    const entry = {
      thoughts,
      index: currentIndex,
      hasShownCustomPrompt,
      isFallback,
    };
    setAutoThoughtCache(cacheKey, entry);
  }, [cacheKey, currentIndex, hasShownCustomPrompt, thoughts, isFallback]);

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
    reloadThoughts: loadThoughts,
  };
}
