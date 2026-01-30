"use client";

import type { AccessContext } from "@/lib/types/access";
import type { EmotionNote } from "@/lib/types/emotionNoteTypes";
import { buildApiUrl } from "@/lib/utils/apiBase";
import { buildAuthHeaders } from "@/lib/utils/buildAuthHeaders";
import { getGuestNotesForDate } from "@/lib/utils/guestStorage";

export const fetchEmotionNotes = async (
  access: AccessContext,
  date: Date = new Date(),
) => {
  if (access.mode === "guest") {
    return getGuestNotesForDate(date);
  }
  if (access.mode !== "auth" || !access.accessToken) {
    return {
      response: new Response(null, { status: 401 }),
      data: { notes: [] as EmotionNote[] },
    };
  }

  const response = await fetch(buildApiUrl("/api/emotion-notes"), {
    headers: buildAuthHeaders(access.accessToken),
  });

  const data = response.ok
    ? ((await response.json()) as { notes: EmotionNote[] })
    : { notes: [] };

  return { response, data };
};
