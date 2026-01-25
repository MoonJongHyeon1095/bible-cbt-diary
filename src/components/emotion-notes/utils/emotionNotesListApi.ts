"use client";

import type { EmotionNote } from "@/lib/types/types";
import { buildAuthHeaders } from "@/lib/utils/buildAuthHeaders";

export const fetchEmotionNotes = async (accessToken: string) => {
  const response = await fetch("/api/emotion-notes", {
    headers: buildAuthHeaders(accessToken),
  });

  const data = response.ok
    ? ((await response.json()) as { notes: EmotionNote[] })
    : { notes: [] };

  return { response, data };
};
