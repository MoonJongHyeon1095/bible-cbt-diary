"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { buildAuthHeaders } from "@/lib/utils/buildAuthHeaders";

const APP_API_KEY = process.env.NEXT_PUBLIC_APP_API_KEY ?? "";

export const buildUsageHeaders = async (
  options: { includeContentType?: boolean } = {},
) => {
  const supabase = getSupabaseBrowserClient();
  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;
  const headers: Record<string, string> = {};
  if (options.includeContentType ?? true) {
    headers["Content-Type"] = "application/json";
  }
  if (APP_API_KEY) {
    headers["x-api-key"] = APP_API_KEY;
  }
  if (accessToken) {
    Object.assign(headers, buildAuthHeaders(accessToken));
  }
  return headers;
};
