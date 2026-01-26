"use client";

import type { AccessContext } from "@/lib/types/access";
import type { EmotionNote } from "@/lib/types/types";
import { buildAuthHeaders } from "@/lib/utils/buildAuthHeaders";
import { getGuestNotesByMonth } from "@/lib/utils/guestStorage";
import { getKstMonthRange } from "@/lib/utils/time";

export const fetchEmotionNotesByRange = async (
  start: Date,
  _end: Date,
  access: AccessContext,
) => {
  const { startIso, endIso } = getKstMonthRange(start);
  if (access.mode === "guest") {
    return getGuestNotesByMonth(start);
  }
  if (access.mode !== "auth" || !access.accessToken) {
    return {
      response: new Response(null, { status: 401 }),
      data: { notes: [] as EmotionNote[] },
    };
  }
  const response = await fetch(
    `/api/emotion-notes?start=${startIso}&end=${endIso}`,
    {
      headers: buildAuthHeaders(access.accessToken),
    },
  );

  const data = response.ok
    ? ((await response.json()) as { notes: EmotionNote[] })
    : { notes: [] };

  return { response, data };
};
