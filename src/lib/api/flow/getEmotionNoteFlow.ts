"use client";

import type { EmotionNote, EmotionNoteMiddle } from "@/lib/types/emotionNoteTypes";
import { buildApiUrl } from "@/lib/utils/apiBase";
import { buildAuthHeaders } from "@/lib/utils/buildAuthHeaders";

export type EmotionFlowSummary = {
  id: number;
  created_at: string;
  note_count: number;
};

export const fetchEmotionNoteFlow = async (
  accessToken: string,
  flowId: number,
  options?: { includeMiddles?: boolean },
) => {
  const includeMiddles =
    options?.includeMiddles === undefined ? true : options.includeMiddles;
  const url = buildApiUrl(
    `/api/emotion-flow?flowId=${flowId}&includeMiddles=${
      includeMiddles ? "1" : "0"
    }`,
  );
  const response = await fetch(url, {
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

export const fetchEmotionFlows = async (accessToken: string) => {
  const response = await fetch(
    buildApiUrl("/api/emotion-flow?action=flows"),
    {
      headers: buildAuthHeaders(accessToken),
    },
  );

  const data = response.ok
    ? ((await response.json()) as { flows: EmotionFlowSummary[] })
    : { flows: [] };

  return { response, data };
};

export const fetchEmotionNoteById = async (
  accessToken: string,
  noteId: number,
) => {
  const response = await fetch(buildApiUrl(`/api/emotion-notes?id=${noteId}`), {
    headers: buildAuthHeaders(accessToken),
  });

  const data = response.ok
    ? ((await response.json()) as { note: EmotionNote | null })
    : { note: null };

  return { response, data };
};
