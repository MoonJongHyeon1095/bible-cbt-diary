"use client";

import { buildApiUrl } from "@/lib/utils/apiBase";
import { getDeviceId } from "@/lib/utils/deviceId";
import type { TokenUsage } from "@/lib/utils/tokenSessionStorage";
import { buildUsageHeaders } from "@/lib/api/token-usage/_helpers";

export const syncTokenUsage = async (
  usage: TokenUsage,
  counts?: { session_count?: number },
) => {
  const deviceId = getDeviceId();
  const headers = await buildUsageHeaders();
  const payloadUsage = { ...usage, ...(counts ?? {}) };
  const response = await fetch(buildApiUrl("/api/token-usage"), {
    method: "POST",
    headers,
    body: JSON.stringify({ deviceId, usage: payloadUsage }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.error ?? `token_usage failed (${response.status})`);
  }
};
