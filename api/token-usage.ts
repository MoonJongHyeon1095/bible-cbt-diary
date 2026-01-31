import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createSupabaseAdminClient } from "../src/lib/supabase/adminNode.js";
import { getUserFromAuthHeader } from "../src/lib/auth/sessionNode.js";
import { json, methodNotAllowed, readJson, handleCors } from "./_utils.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  if (req.method !== "POST") {
    return methodNotAllowed(res);
  }

  const body = await readJson<{
    action?: "status";
    deviceId?: string;
    usage?: {
      total_tokens?: number;
      input_tokens?: number;
      output_tokens?: number;
      request_count?: number;
      session_count?: number;
      note_proposal_count?: number;
    };
  }>(req);

  const deviceId = body?.deviceId;
  const usage = body?.usage ?? {};
  const action = body?.action;
  const user = await getUserFromAuthHeader(req.headers.authorization);
  const userId = user?.id ?? null;
  const requestId = req.headers["x-request-id"];
  let supabase;

  if ((!deviceId || typeof deviceId !== "string") && !userId) {
    console.error("[token-usage] missing identity", {
      action,
      requestId,
      hasDeviceId: Boolean(deviceId),
      hasUserId: Boolean(userId),
    });
    return json(res, 400, { error: "deviceId or userId is required" });
  }

  if (action === "status") {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth() + 1;
    const day = now.getUTCDate();

    try {
      supabase = createSupabaseAdminClient();
    } catch (error) {
      console.error("[token-usage] admin client init failed", {
        action,
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

    if (userId) {
      query = query.eq("user_id", userId);
    } else {
      query = query.eq("device_id", deviceId);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      console.error("[token-usage] status query failed", {
        action,
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
  }

  const resolvedDeviceId = userId ? null : deviceId;
  const totalTokensRaw = Number(usage?.total_tokens || 0);
  const inputTokens = Number(usage?.input_tokens || 0);
  const outputTokens = Number(usage?.output_tokens || 0);
  const totalTokens = totalTokensRaw || inputTokens + outputTokens;
  const requestCount = Number(usage?.request_count || 0);
  const sessionCount = Number(usage?.session_count || 0);
  const noteProposalCount = Number(usage?.note_proposal_count || 0);

  if (
    [
      totalTokens,
      inputTokens,
      outputTokens,
      requestCount,
      sessionCount,
      noteProposalCount,
    ].some((value) => !Number.isFinite(value) || value < 0)
  ) {
    console.error("[token-usage] invalid usage values", {
      action,
      requestId,
      userId,
      hasDeviceId: Boolean(deviceId),
      usage,
    });
    return json(res, 400, { error: "invalid usage values" });
  }

  if (
    totalTokens +
      inputTokens +
      outputTokens +
      requestCount +
      sessionCount +
      noteProposalCount ===
    0
  ) {
    return json(res, 200, { ok: true });
  }

  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;
  const day = now.getUTCDate();

  try {
    supabase = createSupabaseAdminClient();
  } catch (error) {
    console.error("[token-usage] admin client init failed", {
      action,
      requestId,
      error,
    });
    return json(res, 500, {
      error: "Supabase admin client init failed",
      details: error,
    });
  }
  const { error } = await supabase.rpc("increment_token_usages", {
    p_user_id: userId,
    p_device_id: resolvedDeviceId,
    p_year: year,
    p_month: month,
    p_day: day,
    p_total_tokens: totalTokens,
    p_input_tokens: inputTokens,
    p_output_tokens: outputTokens,
    p_request_count: requestCount,
    p_session_count: sessionCount,
    p_note_proposal_count: noteProposalCount,
  });

  if (error) {
    console.error("[token-usage] rpc failed", {
      action,
      requestId,
      userId,
      hasDeviceId: Boolean(deviceId),
      year,
      month,
      day,
      error,
    });
    return json(res, 500, { error: "Failed to update usage", details: error });
  }

  return json(res, 200, { ok: true });
}
