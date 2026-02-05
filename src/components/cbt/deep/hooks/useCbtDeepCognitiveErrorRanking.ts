import { useEffect, useMemo, useState } from "react";
import {
  analyzeDeepCognitiveErrorDetails,
  rankDeepCognitiveErrors,
  COGNITIVE_ERRORS_BY_INDEX,
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
  const [withinIndex, setWithinIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [detailFallbackByIndex, setDetailFallbackByIndex] = useState<
    Partial<Record<ErrorIndex, boolean>>
  >({});

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
    setDetailFallbackByIndex({});
    setPageIndex(0);
    setWithinIndex(0);
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
  const currentIndex = pageIndex * BATCH_SIZE + withinIndex;

  useEffect(() => {
    if (!detailQuery.data) return;
    const detailFallback = isAiFallback(detailQuery.data);
    setDetailByIndex((prev) => {
      const next = { ...prev };
      detailQuery.data.errors.forEach((item) => {
        next[item.index] = { index: item.index, analysis: item.analysis };
      });
      return next;
    });
    setDetailFallbackByIndex((prev) => {
      const next = { ...prev };
      detailQuery.data.errors.forEach((item) => {
        next[item.index] = detailFallback;
      });
      return next;
    });
  }, [detailQuery.data]);

  useEffect(() => {
    if (detailQuery.isError) {
      setError("오류가 발생했습니다.");
    }
  }, [detailQuery.isError]);

  useEffect(() => {
    setWithinIndex(0);
  }, [pageIndex]);

  const currentRankItem = useMemo(() => {
    const start = pageIndex * BATCH_SIZE;
    return ranked[start + withinIndex] ?? null;
  }, [pageIndex, ranked, withinIndex]);
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
    if (pageIndex < Math.ceil(ranked.length / BATCH_SIZE) - 1) {
      setPageIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (rankLoading || detailLoading) return;
    if (withinIndex > 0) {
      setWithinIndex((prev) => prev - 1);
      return;
    }
    if (pageIndex > 0) {
      setPageIndex((prev) => prev - 1);
      setWithinIndex(BATCH_SIZE - 1);
    }
  };

  const handleSelectIndex = (index: number) => {
    setPageIndex(Math.floor(index / BATCH_SIZE));
    setWithinIndex(index % BATCH_SIZE);
  };

  const reset = () => {
    setDetailByIndex({});
    setDetailFallbackByIndex({});
    setPageIndex(0);
    setWithinIndex(0);
    setError(null);
  };

  return {
    ranked,
    detailByIndex,
    currentMeta,
    currentRankItem,
    currentDetail,
    currentDetailFallback,
    canPrev,
    canNext,
    pageIndex,
    withinIndex,
    currentIndex,
    loading: rankLoading,
    rankLoading,
    detailLoading,
    error,
    isFallback: rankFallback,
    setCurrentIndex: handleSelectIndex,
    reload: async () => {
      await rankQuery.refetch();
    },
    handleNext,
    handlePrev,
    handleSelectIndex,
    reset,
  };
}
