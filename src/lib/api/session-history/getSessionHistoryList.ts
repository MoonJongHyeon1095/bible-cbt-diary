"use client";

import type { AccessContext } from "@/lib/types/access";
import type { SessionHistory } from "@/lib/types/sessionTypes";
import { buildApiUrl } from "@/lib/utils/apiBase";
import { appendQuery, resolveAccess } from "@/lib/api/_helpers";

type FetchSessionHistoriesOptions = {
  limit?: number;
  offset?: number;
};

// GET /api/session-history?limit=...&offset=...
// session-history 목록 조회
export const fetchSessionHistoryList = async (
  access: AccessContext,
  options: FetchSessionHistoriesOptions = {},
) => {
  const resolved = resolveAccess(access);
  if (resolved.kind === "blocked") {
    return {
      response: new Response(null, { status: 401 }),
      data: { histories: [] as SessionHistory[] },
    };
  }

  const limit = options.limit ?? 50;
  const offset = options.offset ?? 0;
  const url = appendQuery(buildApiUrl("/api/session-history"), {
    limit: String(limit),
    offset: String(offset),
    ...(resolved.kind === "guest" ? { deviceId: resolved.deviceId } : {}),
  });

  const response = await fetch(url, {
    headers: resolved.kind === "auth" ? resolved.headers : undefined,
  });

  const data = response.ok
    ? ((await response.json()) as { histories: SessionHistory[] })
    : { histories: [] };

  return { response, data };
};
