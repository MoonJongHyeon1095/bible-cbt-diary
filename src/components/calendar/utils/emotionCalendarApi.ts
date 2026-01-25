"use client";

import type { EmotionNote } from "@/lib/types/types";
import { buildAuthHeaders } from "@/lib/utils/buildAuthHeaders";
import { getKstMonthRange } from "@/lib/utils/time";

export const fetchEmotionNotesByRange = async (
  start: Date,
  _end: Date,
  accessToken: string,
) => {
  const { startIso, endIso } = getKstMonthRange(start);
  const response = await fetch(
    `/api/emotion-notes?start=${startIso}&end=${endIso}`,
    {
      headers: buildAuthHeaders(accessToken),
    },
  );

  const data = response.ok
    ? ((await response.json()) as { notes: EmotionNote[] })
    : { notes: [] };

  return { response, data };
};
