"use client";

import { fetchEmotionFlowList } from "@/lib/api/flow/getEmotionNoteFlow";
import { queryKeys } from "@/lib/queryKeys";
import type { AccessContext } from "@/lib/types/access";
import { useQuery } from "@tanstack/react-query";

export const useFlowListQuery = (access: AccessContext) =>
  useQuery({
    queryKey: queryKeys.flow.flows(access),
    queryFn: async () => {
      const { response, data } = await fetchEmotionFlowList(access);
      if (!response.ok) {
        throw new Error("emotion_flow list fetch failed");
      }
      return data.flows ?? [];
    },
    enabled: access.mode !== "blocked",
  });
