"use client";

import { buildApiUrl } from "@/lib/utils/apiBase";
import { getDeviceId } from "@/lib/utils/deviceId";
import { buildUsageHeaders } from "@/lib/api/token-usage/_helpers";

export type TokenUsageStatus = {
  usage: {
    year: number;
    month: number;
    day: number;
    daily_usage: number;
    monthly_usage: number;
    request_count: number;
    input_tokens: number;
    output_tokens: number;
  };
  is_member: boolean;
};

// GET /api/token-usage
// token-usage 상태 조회
export const fetchTokenUsageStatus = async (): Promise<TokenUsageStatus> => {
  const deviceId = getDeviceId();
  const headers = await buildUsageHeaders({ includeContentType: false });
  const query = new URLSearchParams({ deviceId }).toString();
  const response = await fetch(buildApiUrl(`/api/token-usage?${query}`), {
    method: "GET",
    headers,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      payload?.error ?? `token_usage_status failed (${response.status})`,
    );
  }

  return payload as TokenUsageStatus;
};
