"use client";

import type { SessionHistory } from "@/lib/types/cbtTypes";
import { buildAuthHeaders } from "@/lib/utils/buildAuthHeaders";

type FetchSessionHistoriesOptions = {
  limit?: number;
  offset?: number;
};

export const fetchSessionHistories = async (
  accessToken: string,
  options: FetchSessionHistoriesOptions = {},
) => {
  const limit = options.limit ?? 50;
  const offset = options.offset ?? 0;
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  const response = await fetch(`/api/session-history?${params.toString()}`, {
    headers: buildAuthHeaders(accessToken),
  });

  const data = response.ok
    ? ((await response.json()) as { histories: SessionHistory[] })
    : { histories: [] };

  return { response, data };
};

export const deleteSessionHistory = async (accessToken: string, id: string) => {
  const response = await fetch(`/api/session-history?id=${id}`, {
    method: "DELETE",
    headers: buildAuthHeaders(accessToken),
  });

  return { response };
};

export const deleteAllSessionHistories = async (accessToken: string) => {
  const response = await fetch("/api/session-history?all=true", {
    method: "DELETE",
    headers: buildAuthHeaders(accessToken),
  });

  return { response };
};
