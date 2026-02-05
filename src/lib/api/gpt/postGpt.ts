"use client";

import { buildApiUrl } from "@/lib/utils/apiBase";
import { buildAuthHeaders } from "@/lib/utils/buildAuthHeaders";

export type PostGptPayload = {
  prompt: string;
  systemPrompt?: string;
  model?: string;
  accessToken?: string | null;
  deviceId?: string | null;
};

export const postGpt = async (payload: PostGptPayload) => {
  const body: Record<string, string> = { prompt: payload.prompt };
  if (payload.systemPrompt) body.systemPrompt = payload.systemPrompt;
  if (payload.model) body.model = payload.model;
  if (!payload.accessToken && payload.deviceId) body.deviceId = payload.deviceId;

  const res = await fetch(buildApiUrl("/api/gpt"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(payload.accessToken ? buildAuthHeaders(payload.accessToken) : {}),
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  return { response: res, data };
};
