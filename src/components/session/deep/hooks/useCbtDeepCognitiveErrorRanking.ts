import { useEffect, useMemo, useState } from "react";
import {
  analyzeDeepCognitiveErrorDetails,
  rankDeepCognitiveErrors,
  type ErrorIndex,
} from "@/lib/ai";
import type { DeepInternalContext } from "@/lib/gpt/deepContext";
import { isAiFallback } from "@/lib/utils/aiFallback";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";

type DetailItem = {
  index: ErrorIndex;
  analysis: string;
};


type UseDeepCognitiveErrorRankingParams = {
  userInput: string;
  thought: string;
  internalContext: DeepInternalContext | null;
};

const BATCH_SIZE = 3;

export function useCbtDeepCognitiveErrorRanking({
  userInput,
  thought,
  internalContext,
}: UseDeepCognitiveErrorRankingParams) {
  const [detailByIndex, setDetailByIndex] = useState<
    Partial<Record<ErrorIndex, DetailItem>>
  >({});
  const [pageIndex, setPageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const cacheKey = useMemo(() => {
    const ctxKey = internalContext
      ? JSON.stringify(internalContext)
      : "no-context";
    return `${userInput.trim()}::${thought.trim()}::${ctxKey}`;
  }, [internalContext, thought, userInput]);

  const rankQuery = useQuery({
    queryKey: queryKeys.ai.deepCognitiveErrorRank(cacheKey),
    queryFn: async () => rankDeepCognitiveErrors(userInput, thought),
    enabled: Boolean(userInput.trim() && thought.trim() && internalContext),
  });

  const ranked = useMemo(() => rankQuery.data?.ranked ?? [], [rankQuery.data]);
  const rankFallback = rankQuery.data ? isAiFallback(rankQuery.data) : false;
  const rankLoading = rankQuery.isPending || rankQuery.isFetching;

  useEffect(() => {
    setDetailByIndex({});
    setPageIndex(0);
    setError(null);
  }, [cacheKey]);

  useEffect(() => {
    if (rankQuery.isError) {
      setError("오류가 발생했습니다.");
    }
  }, [rankQuery.isError]);

  const currentIndices = useMemo(() => {
    const start = pageIndex * BATCH_SIZE;
    return ranked.slice(start, start + BATCH_SIZE).map((item) => item.index);
  }, [pageIndex, ranked]);

  const missing = useMemo(
    () => currentIndices.filter((idx) => !detailByIndex[idx]),
    [currentIndices, detailByIndex],
  );

  const detailKey = missing.join(",");

  const detailQuery = useQuery({
    queryKey: queryKeys.ai.deepCognitiveErrorDetail(cacheKey, detailKey),
    queryFn: async () => {
      if (!internalContext) {
        return { errors: [] } as { errors: DetailItem[] };
      }
      return analyzeDeepCognitiveErrorDetails(
        userInput,
        thought,
        internalContext,
        missing,
      );
    },
    enabled:
      Boolean(detailKey) && Boolean(rankQuery.data) && Boolean(internalContext),
  });

  const detailLoading = detailQuery.isPending || detailQuery.isFetching;

  useEffect(() => {
    if (!detailQuery.data) return;
    setDetailByIndex((prev) => {
      const next = { ...prev };
      detailQuery.data.errors.forEach((item) => {
        next[item.index] = { index: item.index, analysis: item.analysis };
      });
      return next;
    });
  }, [detailQuery.data]);

  useEffect(() => {
    if (detailQuery.isError) {
      setError("오류가 발생했습니다.");
    }
  }, [detailQuery.isError]);

  const reset = () => {
    setDetailByIndex({});
    setPageIndex(0);
    setError(null);
  };

  const visibleCount = Math.min(ranked.length, (pageIndex + 1) * BATCH_SIZE);
  const visibleRanked = ranked.slice(0, visibleCount);
  const canLoadMore = visibleCount < ranked.length;

  const loadMore = () => {
    if (rankLoading) return;
    if (!canLoadMore) return;
    setPageIndex((prev) => prev + 1);
  };

  return {
    ranked,
    detailByIndex,
    visibleRanked,
    canLoadMore,
    loading: rankLoading,
    rankLoading,
    detailLoading,
    error,
    isFallback: rankFallback,
    reload: async () => {
      await rankQuery.refetch();
    },
    loadMore,
    reset,
  };
}
