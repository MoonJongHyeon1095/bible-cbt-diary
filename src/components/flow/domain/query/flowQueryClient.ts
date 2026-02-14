import { queryKeys } from "@/lib/queryKeys";
import type { AccessContext } from "@/lib/types/access";
import type { QueryClient } from "@tanstack/react-query";

export const patchFlowCountAcrossLists = (
  queryClient: QueryClient,
  flowId: number,
  delta: number,
) => {
  queryClient.setQueriesData(
    { queryKey: ["emotion-flow", "flows"], type: "all" },
    (prev) => {
      if (!Array.isArray(prev)) return prev;
      return prev.map((flow) =>
        flow.id === flowId
          ? { ...flow, note_count: Math.max(0, (flow.note_count ?? 0) + delta) }
          : flow,
      );
    },
  );
};

export const invalidateFlowListQueries = async (
  queryClient: QueryClient,
  access: AccessContext,
  noteId?: number | null,
) => {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: queryKeys.flow.flows(access, noteId),
    }),
    queryClient.invalidateQueries({
      queryKey: ["emotion-flow", "flows"],
    }),
  ]);
};

export const invalidateFlowDetailQuery = async (
  queryClient: QueryClient,
  access: AccessContext,
  flowId: number,
) => {
  await queryClient.invalidateQueries({
    queryKey: queryKeys.flow.flow(access, flowId, true),
  });
};
