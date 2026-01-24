"use client";

import { buildAuthHeaders } from "@/components/utils/api";
import type { SessionHistory } from "@/lib/cbtTypes";

export const fetchSessionHistories = async (accessToken: string) => {
  const response = await fetch("/api/session-history?limit=50", {
    headers: buildAuthHeaders(accessToken),
  });

  const data = response.ok
    ? ((await response.json()) as { histories: SessionHistory[] })
    : { histories: [] };

  return { response, data };
};

export const deleteSessionHistory = async (
  accessToken: string,
  id: string,
) => {
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
