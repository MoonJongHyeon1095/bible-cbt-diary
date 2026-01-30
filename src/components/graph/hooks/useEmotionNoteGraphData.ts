"use client";

import type { EmotionNote, EmotionNoteMiddle } from "@/lib/types/emotionNoteTypes";
import { useEffect, useState } from "react";
import {
  fetchEmotionNoteGraph,
  fetchEmotionNoteById,
} from "../utils/emotionNoteGraphApi";

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
  const [notes, setNotes] = useState<EmotionNote[]>([]);
  const [middles, setMiddles] = useState<EmotionNoteMiddle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!groupId && !noteId) {
        setNotes([]);
        setMiddles([]);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      if (groupId) {
        const { response, data } = await fetchEmotionNoteGraph(
          accessToken,
          groupId,
        );
        if (!response.ok) {
          setNotes([]);
          setMiddles([]);
          setIsLoading(false);
          return;
        }
        setNotes(data.notes ?? []);
        setMiddles(data.middles ?? []);
        setIsLoading(false);
        return;
      }

      if (noteId) {
        const { response, data } = await fetchEmotionNoteById(
          accessToken,
          noteId,
        );
        if (!response.ok || !data.note) {
          setNotes([]);
          setMiddles([]);
          setIsLoading(false);
          return;
        }
        setNotes([data.note]);
        setMiddles([]);
        setIsLoading(false);
      }
    };
    load();
  }, [accessToken, groupId, noteId]);

  return { notes, middles, isLoading };
};
