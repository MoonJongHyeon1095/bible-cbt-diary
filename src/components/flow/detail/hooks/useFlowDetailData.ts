"use client";

import type { AccessContext } from "@/lib/types/access";
import { useMemo } from "react";
import { useFlowDetailQuery } from "./useFlowDetailQuery";

type UseFlowDetailDataParams = {
  access: AccessContext;
  flowId: number | null;
};

export const useFlowDetailData = ({
  access,
  flowId,
}: UseFlowDetailDataParams) => {
  const flowQuery = useFlowDetailQuery(access, flowId, true);

  return useMemo(() => {
    if (!flowId) {
      return {
        flow: null,
        notes: [],
        middles: [],
        montages: [],
        isLoading: false,
      };
    }

    return {
      flow: flowQuery.data?.flow ?? null,
      notes: flowQuery.data?.notes ?? [],
      middles: flowQuery.data?.middles ?? [],
      montages: flowQuery.data?.montages ?? [],
      isLoading: flowQuery.isPending || flowQuery.isFetching,
    };
  }, [flowId, flowQuery.data, flowQuery.isPending, flowQuery.isFetching]);
};
