"use client";

import type { EmotionNote, EmotionNoteMiddle } from "@/lib/types";
import { buildAuthHeaders } from "@/components/utils/api";

export type EmotionNoteGroupSummary = {
  id: number;
  created_at: string;
  note_count: number;
};

export const fetchEmotionGraph = async (
  accessToken: string,
  groupId: number,
) => {
  const response = await fetch(`/api/emotion-note-graph?groupId=${groupId}`, {
    headers: buildAuthHeaders(accessToken),
  });

  const data = response.ok
    ? ((await response.json()) as {
        notes: EmotionNote[];
        middles: EmotionNoteMiddle[];
      })
    : { notes: [], middles: [] };

  return { response, data };
};

export const fetchEmotionNoteGroups = async (accessToken: string) => {
  const response = await fetch("/api/emotion-note-graph/group-list", {
    headers: buildAuthHeaders(accessToken),
  });

  const data = response.ok
    ? ((await response.json()) as { groups: EmotionNoteGroupSummary[] })
    : { groups: [] };

  return { response, data };
};

export const fetchEmotionNoteById = async (
  accessToken: string,
  noteId: number,
) => {
  const response = await fetch(`/api/emotion-notes?id=${noteId}`, {
    headers: buildAuthHeaders(accessToken),
  });

  const data = response.ok
    ? ((await response.json()) as { note: EmotionNote | null })
    : { note: null };

  return { response, data };
};
