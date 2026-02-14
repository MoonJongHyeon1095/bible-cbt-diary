"use client";

import { buildApiUrl } from "@/lib/utils/apiBase";
import { getDeviceId } from "@/lib/storage/device/deviceId";
import type { TokenUsage } from "@/lib/storage/token/sessionUsage";
import { buildUsageHeaders } from "@/lib/api/token-usage/_helpers";

// POST /api/token-usage
// token-usage 등록
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
