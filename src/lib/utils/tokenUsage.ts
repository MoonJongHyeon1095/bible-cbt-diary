import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { buildAuthHeaders } from "@/lib/utils/buildAuthHeaders";
import { getDeviceId } from "@/lib/utils/deviceId";
import type { TokenUsage } from "@/lib/utils/tokenSessionStorage";

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

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";
const APP_API_KEY = process.env.NEXT_PUBLIC_APP_API_KEY ?? "";

const buildUsageHeaders = async () => {
  const supabase = getSupabaseBrowserClient();
  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (APP_API_KEY) {
    headers["x-api-key"] = APP_API_KEY;
  }
  if (accessToken) {
    Object.assign(headers, buildAuthHeaders(accessToken));
  }
  return headers;
};

export const syncTokenUsage = async (
  usage: TokenUsage,
  counts?: { session_count?: number },
) => {
  const deviceId = getDeviceId();
  const headers = await buildUsageHeaders();
  const payloadUsage = { ...usage, ...(counts ?? {}) };
  const response = await fetch(`${API_BASE}/api/token-usage`, {
    method: "POST",
    headers,
    body: JSON.stringify({ deviceId, usage: payloadUsage }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.error ?? `token_usage failed (${response.status})`);
  }
};

export const fetchTokenUsageStatus = async (): Promise<TokenUsageStatus> => {
  const deviceId = getDeviceId();
  const headers = await buildUsageHeaders();
  const response = await fetch(`${API_BASE}/api/token-usage-status`, {
    method: "POST",
    headers,
    body: JSON.stringify({ deviceId }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      payload?.error ?? `token_usage_status failed (${response.status})`,
    );
  }

  return payload as TokenUsageStatus;
};
