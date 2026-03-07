"use client";

import type { AccessContext } from "@/lib/types/access";
import type { EmotionNote } from "@/lib/types/emotionNoteTypes";
import { buildApiUrl } from "@/lib/utils/apiBase";
import { appendQuery, resolveAccess } from "@/lib/api/_helpers";

type FetchEmotionHistoryOptions = {
  limit?: number;
  offset?: number;
};

export const fetchEmotionNoteHistoryList = async (
  access: AccessContext,
  options: FetchEmotionHistoryOptions = {},
) => {
  const resolved = resolveAccess(access);
  if (resolved.kind === "blocked") {
    return {
      response: new Response(null, { status: 401 }),
      data: { notes: [] as EmotionNote[] },
    };
  }

  const limit = options.limit ?? 50;
  const offset = options.offset ?? 0;
  const url = appendQuery(buildApiUrl("/api/emotion-notes"), {
    action: "history",
    limit: String(limit),
    offset: String(offset),
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
