"use client";

import { useMemo } from "react";
import {
  fetchEmotionNoteById,
  fetchEmotionNoteFlow,
} from "@/lib/api/flow/getEmotionNoteFlow";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";

type UseEmotionNoteFlowDataParams = {
  accessToken: string;
  flowId: number | null;
  noteId: number | null;
};

export const useEmotionNoteFlowData = ({
  accessToken,
  flowId,
  noteId,
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

  const noteQuery = useQuery({
    queryKey: queryKeys.flow.note(accessToken, noteId ?? 0),
    queryFn: async () => {
      if (!noteId) {
        return { notes: [], middles: [] };
      }
      const { response, data } = await fetchEmotionNoteById(
        accessToken,
        noteId,
      );
      if (!response.ok || !data.note) {
        throw new Error("emotion_note_flow_note fetch failed");
      }
      return { notes: [data.note], middles: [] };
    },
    enabled: Boolean(accessToken && noteId && !flowId),
  });

  const result = useMemo(() => {
    if (flowId) {
      return {
        notes: flowQuery.data?.notes ?? [],
        middles: flowQuery.data?.middles ?? [],
        isLoading: flowQuery.isPending || flowQuery.isFetching,
      };
    }
    if (noteId) {
      return {
        notes: noteQuery.data?.notes ?? [],
        middles: noteQuery.data?.middles ?? [],
        isLoading: noteQuery.isPending || noteQuery.isFetching,
      };
    }
    return { notes: [], middles: [], isLoading: false };
  }, [
    flowId,
    noteId,
    flowQuery.data,
    flowQuery.isPending,
    flowQuery.isFetching,
    noteQuery.data,
    noteQuery.isPending,
    noteQuery.isFetching,
  ]);

  return result;
};
