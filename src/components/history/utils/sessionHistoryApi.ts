"use client";

import type { AccessContext } from "@/lib/types/access";
import type { SessionHistory } from "@/lib/types/cbtTypes";
import { buildApiUrl } from "@/lib/utils/apiBase";
import { buildAuthHeaders } from "@/lib/utils/buildAuthHeaders";
import {
  deleteAllGuestSessionHistories,
  deleteGuestSessionHistory,
  listGuestSessionHistories,
} from "@/lib/utils/guestStorage";

type FetchSessionHistoriesOptions = {
  limit?: number;
  offset?: number;
};

export const fetchSessionHistories = async (
  access: AccessContext,
  options: FetchSessionHistoriesOptions = {},
) => {
  if (access.mode === "guest") {
    return listGuestSessionHistories(options);
  }
  if (access.mode !== "auth" || !access.accessToken) {
    return {
      response: new Response(null, { status: 401 }),
      data: { histories: [] as SessionHistory[] },
    };
  }
  const limit = options.limit ?? 50;
  const offset = options.offset ?? 0;
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  const response = await fetch(
    buildApiUrl(`/api/session-history?${params.toString()}`),
    {
      headers: buildAuthHeaders(access.accessToken),
    },
  );

  const data = response.ok
    ? ((await response.json()) as { histories: SessionHistory[] })
    : { histories: [] };

  return { response, data };
};

export const deleteSessionHistory = async (
  access: AccessContext,
  id: string,
) => {
  if (access.mode === "guest") {
    return deleteGuestSessionHistory(id);
  }
  if (access.mode !== "auth" || !access.accessToken) {
    return { response: new Response(null, { status: 401 }) };
  }
  const response = await fetch(buildApiUrl(`/api/session-history?id=${id}`), {
    method: "DELETE",
    headers: buildAuthHeaders(access.accessToken),
  });

  return { response };
};

export const deleteAllSessionHistories = async (access: AccessContext) => {
  if (access.mode === "guest") {
    return deleteAllGuestSessionHistories();
  }
  if (access.mode !== "auth" || !access.accessToken) {
    return { response: new Response(null, { status: 401 }) };
  }
  const response = await fetch(buildApiUrl("/api/session-history?all=true"), {
    method: "DELETE",
    headers: buildAuthHeaders(access.accessToken),
  });

  return { response };
};
