import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createSupabaseAdminClient } from "../src/lib/supabase/admin";
import { getUserFromAuthHeader } from "../src/lib/auth/session";
import { json, methodNotAllowed, readJson, handleCors } from "./_utils";

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

  if ((!deviceId || typeof deviceId !== "string") && !userId) {
    return json(res, 400, { error: "deviceId or userId is required" });
  }

  if (action === "status") {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth() + 1;
    const day = now.getUTCDate();

    const supabase = createSupabaseAdminClient();
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

  const supabase = createSupabaseAdminClient();
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
    return json(res, 500, { error: "Failed to update usage", details: error });
  }

  return json(res, 200, { ok: true });
}
