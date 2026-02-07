"use client";

import type { AccessContext } from "@/lib/types/access";
import type { EmotionNote } from "@/lib/types/emotionNoteTypes";
import { appendQuery, resolveAccess } from "@/lib/api/_helpers";
import { buildApiUrl } from "@/lib/utils/apiBase";
import { getKstDayRange } from "@/lib/utils/time";

export type EmotionNoteSearchParams = {
  query?: string;
  start?: Date | null;
  end?: Date | null;
  excludeFlowId?: number | null;
};

const buildKstRange = (start?: Date | null, end?: Date | null) => {
  if (!start && !end) {
    return null;
  }
  const from = start ?? end ?? new Date();
  const to = end ?? start ?? new Date();
  const fromRange = getKstDayRange(from);
  const toRange = getKstDayRange(to);
  return {
    startIso: fromRange.startIso,
    endIso: toRange.endIso,
  };
};

// GET /api/emotion-notes?action=search&query=...&start=...&end=...
// emotion-notes 검색 목록 조회
export const fetchEmotionNoteSearchList = async (
  access: AccessContext,
  params: EmotionNoteSearchParams,
) => {
  const resolved = resolveAccess(access);
  if (resolved.kind === "blocked") {
    return {
      response: new Response(null, { status: 401 }),
      data: { notes: [] as EmotionNote[] },
    };
  }

  const range = buildKstRange(params.start, params.end);
  const query = (params.query ?? "").trim();
  const excludeFlowId =
    typeof params.excludeFlowId === "number" ? params.excludeFlowId : null;
  const url = appendQuery(buildApiUrl("/api/emotion-notes"), {
    action: "search",
    ...(query ? { query } : {}),
    ...(range ? { start: range.startIso, end: range.endIso } : {}),
    ...(excludeFlowId ? { excludeFlowId: String(excludeFlowId) } : {}),
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
