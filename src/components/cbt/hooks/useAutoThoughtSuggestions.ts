import { useEffect, useMemo, useRef, useState } from "react";
import { generateExtendedAutomaticThoughts } from "@/lib/ai";
import {
  getAutoThoughtCache,
  setAutoThoughtCache,
} from "@/components/cbt/utils/storage/minimalAutoThoughtCache";

type UseAutoThoughtSuggestionsParams = {
  userInput: string;
  emotion: string;
  onResetSelection: () => void;
};

export function useAutoThoughtSuggestions({
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
  const inFlightKeyRef = useRef<string | null>(null);

  const cacheKey = useMemo(
    () => `${emotion}::${userInput.trim()}`,
    [emotion, userInput],
  );

  const loadThoughts = async () => {
    if (!userInput.trim() || !emotion) return;
    if (inFlightKeyRef.current === cacheKey) return;
    inFlightKeyRef.current = cacheKey;
    setLoading(true);
    setError(null);
    onResetSelection();
    try {
      const result = await generateExtendedAutomaticThoughts(
        userInput,
        emotion,
      );
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
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      if (inFlightKeyRef.current === cacheKey) {
        inFlightKeyRef.current = null;
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userInput.trim() || !emotion) return;
    const cached = getAutoThoughtCache(cacheKey);
    if (cached) {
      setThoughts(cached.thoughts);
      setCurrentIndex(cached.index);
      setHasShownCustomPrompt(cached.hasShownCustomPrompt);
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
    };
    setAutoThoughtCache(cacheKey, entry);
  }, [cacheKey, currentIndex, hasShownCustomPrompt, thoughts]);

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

  return {
    currentThought,
    loading,
    error,
    shouldShowCustom: hasShownCustomPrompt,
    goNextThought,
    goPrevThought,
    canGoPrev,
    canGoNext,
    reloadThoughts: loadThoughts,
  };
}
