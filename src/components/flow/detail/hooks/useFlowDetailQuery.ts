"use client";

import { fetchEmotionNoteFlow } from "@/lib/api/flow/getEmotionNoteFlow";
import { queryKeys } from "@/lib/queryKeys";
import type { AccessContext } from "@/lib/types/access";
import { useQuery } from "@tanstack/react-query";

export const useFlowDetailQuery = (
  access: AccessContext,
  flowId: number | null,
  includeMiddles = true,
) =>
  useQuery({
    queryKey: queryKeys.flow.flow(access, flowId ?? 0, includeMiddles),
    queryFn: async () => {
      if (!flowId) {
        return { notes: [], middles: [], montages: [] };
      }
      const { response, data } = await fetchEmotionNoteFlow(access, flowId, {
        includeMiddles,
      });
      if (!response.ok) {
        throw new Error("emotion_flow detail fetch failed");
      }
      return {
        notes: data.notes ?? [],
        middles: data.middles ?? [],
        montages: data.montages ?? [],
      };
    },
    enabled: access.mode !== "blocked" && Boolean(flowId),
  });
