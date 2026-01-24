"use client";

import type { EmotionNote } from "@/lib/types";
import { buildAuthHeaders } from "@/components/utils/api";

export const fetchEmotionNotesByRange = async (
  start: Date,
  end: Date,
  accessToken: string,
) => {
  const response = await fetch(
    `/api/emotion-notes?start=${start.toISOString()}&end=${end.toISOString()}`,
    {
      headers: buildAuthHeaders(accessToken),
    },
  );

  const data = response.ok
    ? ((await response.json()) as { notes: EmotionNote[] })
    : { notes: [] };

  return { response, data };
};
