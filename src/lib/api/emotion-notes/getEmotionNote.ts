"use client";

import type { AccessContext } from "@/lib/types/access";
import type { EmotionNoteWithDetails } from "@/lib/types/emotionNoteTypes";
import { buildApiUrl } from "@/lib/utils/apiBase";
import { appendQuery, resolveAccess } from "@/lib/api/_helpers";

export const fetchEmotionNote = async (
  noteId: number,
  access: AccessContext,
) => {
  const resolved = resolveAccess(access);
  if (resolved.kind === "blocked") {
    return {
      response: new Response(null, { status: 401 }),
      data: { note: null as EmotionNoteWithDetails | null },
    };
  }

  const url = appendQuery(buildApiUrl(`/api/emotion-notes?id=${noteId}`),
    resolved.kind === "guest" ? { deviceId: resolved.deviceId } : {},
  );

  const response = await fetch(url, {
    headers: resolved.kind === "auth" ? resolved.headers : undefined,
  });

  const data = response.ok
    ? ((await response.json()) as { note: EmotionNoteWithDetails | null })
    : { note: null };
  return { response, data };
};
