"use client";

import type { AccessContext } from "@/lib/types/access";
import type { EmotionNote } from "@/lib/types/emotionNoteTypes";
import { buildApiUrl } from "@/lib/utils/apiBase";
import { getKstDayRange } from "@/lib/utils/time";
import { appendQuery, resolveAccess } from "@/lib/api/_helpers";

// GET /api/emotion-notes?start=...&end=...
// emotion-notes 목록 조회 (today)
export const fetchEmotionNoteList = async (
  access: AccessContext,
  date: Date = new Date(),
) => {
  const resolved = resolveAccess(access);
  if (resolved.kind === "blocked") {
    return {
      response: new Response(null, { status: 401 }),
      data: { notes: [] as EmotionNote[] },
    };
  }

  const { startIso, endIso } = getKstDayRange(date);
  const url = appendQuery(buildApiUrl("/api/emotion-notes"), {
    start: startIso,
    end: endIso,
    ...(resolved.kind === "guest" ? { deviceId: resolved.deviceId } : {}),
  });

  const response = await fetch(url, {
    headers: resolved.kind === "auth" ? resolved.headers : undefined,
  });

  const data = response.ok
    ? ((await response.json()) as { notes: EmotionNote[] })
    : { notes: [] };

  return { response, data };
};
