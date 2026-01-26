import { useEffect, useMemo, useRef, useState } from "react";
import {
  analyzeCognitiveErrorDetails,
  COGNITIVE_ERRORS_BY_INDEX,
  rankCognitiveErrors,
  type ErrorIndex,
} from "@/lib/ai";

type DetailItem = {
  index: ErrorIndex;
  analysis: string;
};

type RankedItem = { index: ErrorIndex; reason: string; evidenceQuote?: string };

type CognitiveErrorCacheEntry = {
  ranked: RankedItem[];
  detailByIndex: Partial<Record<ErrorIndex, DetailItem>>;
  pageIndex: number;
  withinIndex: number;
};

type UseCognitiveErrorRankingParams = {
  userInput: string;
  thought: string;
};

const BATCH_SIZE = 3;
const cognitiveErrorCache = new Map<string, CognitiveErrorCacheEntry>();

export function useCognitiveErrorRanking({
  userInput,
  thought,
}: UseCognitiveErrorRankingParams) {
  const [ranked, setRanked] = useState<RankedItem[]>([]);
  const [detailByIndex, setDetailByIndex] = useState<
    Partial<Record<ErrorIndex, DetailItem>>
  >({});
  const [pageIndex, setPageIndex] = useState(0);
  const [withinIndex, setWithinIndex] = useState(0);
  const [rankLoading, setRankLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pendingDetailRef = useRef<Set<ErrorIndex>>(new Set());
  const inFlightKeyRef = useRef<string | null>(null);
  const cacheKey = useMemo(
    () => `${userInput.trim()}::${thought.trim()}`,
    [userInput, thought],
  );

  const resetState = () => {
    setRanked([]);
    setDetailByIndex({});
    setPageIndex(0);
    setWithinIndex(0);
    setError(null);
    pendingDetailRef.current.clear();
  };

  const fetchDetails = async (indices: ErrorIndex[]) => {
    const unique = indices.filter(
      (idx) => !detailByIndex[idx] && !pendingDetailRef.current.has(idx),
    );
    if (unique.length === 0) return;
    unique.forEach((idx) => pendingDetailRef.current.add(idx));
    setDetailLoading(true);
    try {
      const detail = await analyzeCognitiveErrorDetails(
        userInput,
        thought,
        unique,
      );
      setDetailByIndex((prev) => {
        const next = { ...prev };
        detail.errors.forEach((item) => {
          next[item.index] = { index: item.index, analysis: item.analysis };
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
      const result = await rankCognitiveErrors(userInput, thought);
      setRanked(result.ranked);
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
    if (!userInput.trim() || !thought.trim()) return;
    const cached = cognitiveErrorCache.get(cacheKey);
    if (cached) {
      setRanked(cached.ranked);
      setDetailByIndex(cached.detailByIndex);
      setPageIndex(cached.pageIndex);
      setWithinIndex(cached.withinIndex);
      setRankLoading(false);
      setDetailLoading(false);
      setError(null);
      return;
    }
    void loadRanked();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey, userInput, thought]);

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
      pageIndex,
      withinIndex,
    });
  }, [cacheKey, detailByIndex, pageIndex, ranked, withinIndex]);

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

  return {
    currentRankItem,
    currentDetail,
    currentMeta,
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
