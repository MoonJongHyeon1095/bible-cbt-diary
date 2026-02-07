"use client";

import { useMemo } from "react";
import { fetchEmotionNoteFlow } from "@/lib/api/flow/getEmotionNoteFlow";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";

type UseEmotionNoteFlowDataParams = {
  accessToken: string;
  flowId: number | null;
};

export const useEmotionNoteFlowData = ({
  accessToken,
  flowId,
}: UseEmotionNoteFlowDataParams) => {
  const flowQuery = useQuery({
    queryKey: queryKeys.flow.flow(accessToken, flowId ?? 0, true),
    queryFn: async () => {
      if (!flowId) {
        return { notes: [], middles: [] };
      }
      const { response, data } = await fetchEmotionNoteFlow(
        accessToken,
        flowId,
      );
      if (!response.ok) {
        throw new Error("emotion_flow fetch failed");
      }
      return { notes: data.notes ?? [], middles: data.middles ?? [] };
    },
    enabled: Boolean(accessToken && flowId),
  });

  const result = useMemo(() => {
    if (flowId) {
      return {
        notes: flowQuery.data?.notes ?? [],
        middles: flowQuery.data?.middles ?? [],
        isLoading: flowQuery.isPending || flowQuery.isFetching,
      };
    }
    return { notes: [], middles: [], isLoading: false };
  }, [flowId, flowQuery.data, flowQuery.isPending, flowQuery.isFetching]);

  return result;
};
