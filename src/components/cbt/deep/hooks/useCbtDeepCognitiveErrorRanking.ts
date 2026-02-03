import { useEffect, useMemo, useRef, useState } from "react";
import {
  analyzeDeepCognitiveErrorDetails,
  rankDeepCognitiveErrors,
  COGNITIVE_ERRORS_BY_INDEX,
  type ErrorIndex,
} from "@/lib/ai";
import type { DeepInternalContext } from "@/lib/gpt/deepContext";
import { isAiFallback } from "@/lib/utils/aiFallback";

type DetailItem = {
  index: ErrorIndex;
  analysis: string;
};

type RankedItem = { index: ErrorIndex; reason: string; evidenceQuote?: string };

type CognitiveErrorCacheEntry = {
  ranked: RankedItem[];
  detailByIndex: Partial<Record<ErrorIndex, DetailItem>>;
  detailFallbackByIndex: Partial<Record<ErrorIndex, boolean>>;
  pageIndex: number;
  withinIndex: number;
  rankFallback: boolean;
};

type UseDeepCognitiveErrorRankingParams = {
  userInput: string;
  thought: string;
  internalContext: DeepInternalContext | null;
};

const BATCH_SIZE = 3;
const cognitiveErrorCache = new Map<string, CognitiveErrorCacheEntry>();

export function useCbtDeepCognitiveErrorRanking({
  userInput,
  thought,
  internalContext,
}: UseDeepCognitiveErrorRankingParams) {
  const [ranked, setRanked] = useState<RankedItem[]>([]);
  const [detailByIndex, setDetailByIndex] = useState<
    Partial<Record<ErrorIndex, DetailItem>>
  >({});
  const [pageIndex, setPageIndex] = useState(0);
  const [withinIndex, setWithinIndex] = useState(0);
  const [rankLoading, setRankLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rankFallback, setRankFallback] = useState(false);
  const [detailFallbackByIndex, setDetailFallbackByIndex] = useState<
    Partial<Record<ErrorIndex, boolean>>
  >({});
  const pendingDetailRef = useRef<Set<ErrorIndex>>(new Set());
  const inFlightKeyRef = useRef<string | null>(null);
  const cacheKey = useMemo(() => {
    const ctxKey = internalContext
      ? JSON.stringify(internalContext)
      : "no-context";
    return `${userInput.trim()}::${thought.trim()}::${ctxKey}`;
  }, [internalContext, thought, userInput]);

  const resetState = () => {
    setRanked([]);
    setDetailByIndex({});
    setDetailFallbackByIndex({});
    setPageIndex(0);
    setWithinIndex(0);
    setError(null);
    setRankFallback(false);
    pendingDetailRef.current.clear();
  };

  const fetchDetails = async (indices: ErrorIndex[]) => {
    if (!internalContext) return;
    const unique = indices.filter(
      (idx) => !detailByIndex[idx] && !pendingDetailRef.current.has(idx),
    );
    if (unique.length === 0) return;
    unique.forEach((idx) => pendingDetailRef.current.add(idx));
    setDetailLoading(true);
    try {
      const detail = await analyzeDeepCognitiveErrorDetails(
        userInput,
        thought,
        internalContext,
        unique,
      );
      const detailFallback = isAiFallback(detail);
      setDetailByIndex((prev) => {
        const next = { ...prev };
        detail.errors.forEach((item) => {
          next[item.index] = { index: item.index, analysis: item.analysis };
        });
        return next;
      });
      setDetailFallbackByIndex((prev) => {
        const next = { ...prev };
        detail.errors.forEach((item) => {
          next[item.index] = detailFallback;
        });
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      unique.forEach((idx) => pendingDetailRef.current.delete(idx));
      setDetailLoading(false);
    }
  };

  const loadRanked = async () => {
    if (inFlightKeyRef.current === cacheKey) return;
    inFlightKeyRef.current = cacheKey;
    setRankLoading(true);
    resetState();
    try {
      const result = await rankDeepCognitiveErrors(userInput, thought);
      setRanked(result.ranked);
      setRankFallback(isAiFallback(result));
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      if (inFlightKeyRef.current === cacheKey) {
        inFlightKeyRef.current = null;
      }
      setRankLoading(false);
    }
  };

  useEffect(() => {
    if (!userInput.trim() || !thought.trim() || !internalContext) return;
    const cached = cognitiveErrorCache.get(cacheKey);
    if (cached) {
      setRanked(cached.ranked);
      setDetailByIndex(cached.detailByIndex);
      setDetailFallbackByIndex(cached.detailFallbackByIndex);
      setPageIndex(cached.pageIndex);
      setWithinIndex(cached.withinIndex);
      setRankFallback(cached.rankFallback);
      setRankLoading(false);
      setDetailLoading(false);
      setError(null);
      return;
    }
    void loadRanked();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey, internalContext, thought, userInput]);

  const currentIndices = useMemo(() => {
    const start = pageIndex * BATCH_SIZE;
    return ranked.slice(start, start + BATCH_SIZE).map((item) => item.index);
  }, [pageIndex, ranked]);

  useEffect(() => {
    const missing = currentIndices.filter((idx) => !detailByIndex[idx]);
    if (missing.length === 0) return;
    void fetchDetails(missing);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndices]);

  useEffect(() => {
    if (!cacheKey || ranked.length === 0) return;
    cognitiveErrorCache.set(cacheKey, {
      ranked,
      detailByIndex,
      detailFallbackByIndex,
      pageIndex,
      withinIndex,
      rankFallback,
    });
  }, [
    cacheKey,
    detailByIndex,
    detailFallbackByIndex,
    pageIndex,
    ranked,
    rankFallback,
    withinIndex,
  ]);

  useEffect(() => {
    setWithinIndex(0);
  }, [pageIndex]);

  const currentRankItem = useMemo(() => {
    const start = pageIndex * BATCH_SIZE;
    return ranked[start + withinIndex] ?? null;
  }, [pageIndex, ranked, withinIndex]);
  const currentIndex = pageIndex * BATCH_SIZE + withinIndex;
  const canPrev = currentIndex > 0;
  const canNext = currentIndex < ranked.length - 1;

  const currentDetail = currentRankItem
    ? detailByIndex[currentRankItem.index]
    : null;
  const currentDetailFallback = currentRankItem
    ? Boolean(detailFallbackByIndex[currentRankItem.index])
    : false;
  const currentMeta = currentRankItem
    ? COGNITIVE_ERRORS_BY_INDEX[currentRankItem.index]
    : undefined;

  const handleNext = () => {
    if (rankLoading || detailLoading) return;
    if (withinIndex < currentIndices.length - 1) {
      setWithinIndex((prev) => prev + 1);
      return;
    }
    const nextStart = (pageIndex + 1) * BATCH_SIZE;
    if (nextStart < ranked.length) {
      setPageIndex((prev) => prev + 1);
      return;
    }
  };

  const handlePrev = () => {
    if (rankLoading || detailLoading) return;
    if (withinIndex > 0) {
      setWithinIndex((prev) => prev - 1);
      return;
    }
    if (pageIndex > 0) {
      const prevPage = pageIndex - 1;
      const prevStart = prevPage * BATCH_SIZE;
      const prevEnd = Math.min(prevStart + BATCH_SIZE, ranked.length);
      setPageIndex(prevPage);
      setWithinIndex(Math.max(prevEnd - prevStart - 1, 0));
    }
  };

  const setCurrentIndex = (index: number) => {
    if (ranked.length === 0) return;
    if (!Number.isFinite(index)) return;
    const next = Math.max(0, Math.min(index, ranked.length - 1));
    const nextPage = Math.floor(next / BATCH_SIZE);
    const nextWithin = next % BATCH_SIZE;
    setPageIndex(nextPage);
    setWithinIndex(nextWithin);
  };

  return {
    ranked,
    detailByIndex,
    currentRankItem,
    currentDetail,
    currentMeta,
    currentIndex,
    setCurrentIndex,
    isFallback: rankFallback || currentDetailFallback,
    loading: rankLoading && ranked.length === 0,
    error,
    rankLoading,
    detailLoading,
    handleNext,
    handlePrev,
    canPrev,
    canNext,
    reload: loadRanked,
  };
}
