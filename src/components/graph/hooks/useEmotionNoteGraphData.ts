"use client";

import { useMemo } from "react";
import {
  fetchEmotionNoteById,
  fetchEmotionNoteGraph,
} from "@/lib/api/graph/getEmotionNoteGraph";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";

type UseEmotionNoteGraphDataParams = {
  accessToken: string;
  groupId: number | null;
  noteId: number | null;
};

export const useEmotionNoteGraphData = ({
  accessToken,
  groupId,
  noteId,
}: UseEmotionNoteGraphDataParams) => {
  const groupQuery = useQuery({
    queryKey: queryKeys.graph.group(accessToken, groupId ?? 0, true),
    queryFn: async () => {
      if (!groupId) {
        return { notes: [], middles: [] };
      }
      const { response, data } = await fetchEmotionNoteGraph(
        accessToken,
        groupId,
      );
      if (!response.ok) {
        throw new Error("emotion_note_graph fetch failed");
      }
      return { notes: data.notes ?? [], middles: data.middles ?? [] };
    },
    enabled: Boolean(accessToken && groupId),
  });

  const noteQuery = useQuery({
    queryKey: queryKeys.graph.note(accessToken, noteId ?? 0),
    queryFn: async () => {
      if (!noteId) {
        return { notes: [], middles: [] };
      }
      const { response, data } = await fetchEmotionNoteById(
        accessToken,
        noteId,
      );
      if (!response.ok || !data.note) {
        throw new Error("emotion_note_graph_note fetch failed");
      }
      return { notes: [data.note], middles: [] };
    },
    enabled: Boolean(accessToken && noteId && !groupId),
  });

  const result = useMemo(() => {
    if (groupId) {
      return {
        notes: groupQuery.data?.notes ?? [],
        middles: groupQuery.data?.middles ?? [],
        isLoading: groupQuery.isPending || groupQuery.isFetching,
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
    groupId,
    noteId,
    groupQuery.data,
    groupQuery.isPending,
    groupQuery.isFetching,
    noteQuery.data,
    noteQuery.isPending,
    noteQuery.isFetching,
  ]);

  return result;
};
