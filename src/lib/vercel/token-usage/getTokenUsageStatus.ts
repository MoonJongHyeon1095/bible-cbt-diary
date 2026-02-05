import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createSupabaseAdminClient } from "../../supabase/adminNode.js";
import { getUserFromAuthHeader } from "../../auth/sessionNode.js";
import { getQueryParam, json, normalizeDeviceId } from "../_utils.js";
import { applyIdentityFilter, getUtcDateParts, logMissingIdentity } from "./_shared.js";

export const handleGetTokenUsageStatus = async (
  req: VercelRequest,
  res: VercelResponse,
) => {
  const user = await getUserFromAuthHeader(req.headers.authorization);
  const userId = user?.id ?? null;
  const requestId = req.headers["x-request-id"];

  const deviceId = normalizeDeviceId(getQueryParam(req, "deviceId") ?? undefined);
  if (!deviceId && !userId) {
    return logMissingIdentity(res, {
      action: "status",
      requestId,
      hasDeviceId: Boolean(deviceId),
      hasUserId: Boolean(userId),
    });
  }

  const { year, month, day } = getUtcDateParts();
  let supabase;

  try {
    supabase = createSupabaseAdminClient();
  } catch (error) {
    console.error("[token-usage] admin client init failed", {
      action: "status",
      requestId,
      error,
    });
    return json(res, 500, {
      error: "Supabase admin client init failed",
      details: error,
    });
  }

  let query = supabase
    .from("token_usages")
    .select(
      "year, month, day, monthly_usage, daily_usage, request_count, input_tokens, output_tokens",
    )
    .eq("year", year)
    .eq("month", month);

  query = applyIdentityFilter(query, userId, deviceId);

  const { data, error } = await query.maybeSingle();

  if (error) {
    console.error("[token-usage] status query failed", {
      action: "status",
      requestId,
      userId,
      hasDeviceId: Boolean(deviceId),
      year,
      month,
      error,
    });
    return json(res, 500, { error: "Failed to read usage", details: error });
  }

  const dailyUsage = data?.day === day ? Number(data?.daily_usage || 0) : 0;
  const monthlyUsage = Number(data?.monthly_usage || 0);

  return json(res, 200, {
    ok: true,
    usage: {
      year,
      month,
      day,
      daily_usage: dailyUsage,
      monthly_usage: monthlyUsage,
      request_count: Number(data?.request_count || 0),
      input_tokens: Number(data?.input_tokens || 0),
      output_tokens: Number(data?.output_tokens || 0),
    },
    is_member: Boolean(userId),
  });
};
