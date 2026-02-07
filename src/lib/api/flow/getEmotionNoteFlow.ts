"use client";

import type { EmotionNote, EmotionNoteMiddle } from "@/lib/types/emotionNoteTypes";
import { buildApiUrl } from "@/lib/utils/apiBase";
import { buildAuthHeaders } from "@/lib/utils/buildAuthHeaders";

export type EmotionFlowSummary = {
  id: number;
  created_at: string;
  note_count: number;
};

// GET /api/emotion-flow?action=detail&flowId=...&includeMiddles=...
// flow 상세 조회
export const fetchEmotionNoteFlow = async (
  accessToken: string,
  flowId: number,
  options?: { includeMiddles?: boolean },
) => {
  const includeMiddles =
    options?.includeMiddles === undefined ? true : options.includeMiddles;
  const url = buildApiUrl(
    `/api/emotion-flow?action=detail&flowId=${flowId}&includeMiddles=${
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

// GET /api/emotion-flow?action=list&noteId=...
// flow 목록 조회
export const fetchEmotionFlowList = async (
  accessToken: string,
  noteId?: number | null,
) => {
  const query = noteId ? `?action=list&noteId=${noteId}` : "?action=list";
  const response = await fetch(buildApiUrl(`/api/emotion-flow${query}`), {
    headers: buildAuthHeaders(accessToken),
  });

  const data = response.ok
    ? ((await response.json()) as { flows: EmotionFlowSummary[] })
    : { flows: [] };

  return { response, data };
};
