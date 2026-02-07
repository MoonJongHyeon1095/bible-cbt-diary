import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createSupabaseAdminClient } from "../../supabase/adminNode.js";
import { getUserFromAuthHeader } from "../../auth/sessionNode.js";
import { json, readJson, normalizeDeviceId } from "../_utils.js";
import {
  getUtcDateParts,
  parseUsageCounts,
  isZeroUsage,
  getTokenUsageRowForMonth,
  insertTokenUsageRow,
  updateTokenUsageRow,
  logMissingIdentity,
} from "./_shared.js";

type TokenUsageBody = {
  deviceId?: string;
  usage?: {
    total_tokens?: number;
    input_tokens?: number;
    output_tokens?: number;
    request_count?: number;
    session_count?: number;
    note_proposal_count?: number;
  };
};

// POST /api/token-usage
// token-usage 등록
export const handlePostTokenUsage = async (
  req: VercelRequest,
  res: VercelResponse,
) => {
  const user = await getUserFromAuthHeader(req.headers.authorization);
  const userId = user?.id ?? null;
  const requestId = req.headers["x-request-id"];

  const body = await readJson<TokenUsageBody>(req);
  const deviceId = normalizeDeviceId(body.deviceId);
  const usage = body.usage ?? {};

  if (!deviceId && !userId) {
    return logMissingIdentity(res, {
      action: "usage",
      requestId,
      hasDeviceId: Boolean(deviceId),
      hasUserId: Boolean(userId),
    });
  }

  const counts = parseUsageCounts(usage);
  if (!counts) {
    console.error("[token-usage] invalid usage values", {
      action: "usage",
      requestId,
      userId,
      hasDeviceId: Boolean(deviceId),
      usage,
    });
    return json(res, 400, { error: "invalid usage values" });
  }

  if (isZeroUsage(counts)) {
    return json(res, 200, { ok: true });
  }

  const { year, month, day } = getUtcDateParts();
  let supabase;

  try {
    supabase = createSupabaseAdminClient();
  } catch (error) {
    console.error("[token-usage] admin client init failed", {
      action: "usage",
      requestId,
      error,
    });
    return json(res, 500, {
      error: "Supabase admin client init failed",
      details: error,
    });
  }

  const resolvedDeviceId = userId ? null : deviceId;
  const { data: current, error: currentError } = await getTokenUsageRowForMonth(
    supabase,
    userId,
    resolvedDeviceId,
    year,
    month,
  );

  if (currentError) {
    console.error("[token-usage] month query failed", {
      action: "usage",
      requestId,
      userId,
      hasDeviceId: Boolean(deviceId),
      year,
      month,
      day,
      error: currentError,
    });
    return json(res, 500, { error: "Failed to read usage", details: currentError });
  }

  if (!current) {
    const { error: insertError } = await insertTokenUsageRow(supabase, {
      userId,
      deviceId: resolvedDeviceId,
      year,
      month,
      day,
      totalTokens: counts.totalTokens,
      inputTokens: counts.inputTokens,
      outputTokens: counts.outputTokens,
      requestCount: counts.requestCount,
      sessionCount: counts.sessionCount,
      noteProposalCount: counts.noteProposalCount,
    });

    if (insertError) {
      console.error("[token-usage] insert failed", {
        action: "usage",
        requestId,
        userId,
        hasDeviceId: Boolean(deviceId),
        year,
        month,
        day,
        error: insertError,
      });
      return json(res, 500, { error: "Failed to update usage", details: insertError });
    }

    return json(res, 200, { ok: true });
  }

  const latestDay = Number(current.day || 0);
  if (day < latestDay) {
    return json(res, 200, { ok: true });
  }

  const shouldResetDaily = day > latestDay;
  const nextDailyUsage = shouldResetDaily
    ? counts.totalTokens
    : Number(current.daily_usage || 0) + counts.totalTokens;

  const { error: updateError } = await updateTokenUsageRow(supabase, current.id, {
    day,
    monthly_usage: Number(current.monthly_usage || 0) + counts.totalTokens,
    daily_usage: nextDailyUsage,
    input_tokens: Number(current.input_tokens || 0) + counts.inputTokens,
    output_tokens: Number(current.output_tokens || 0) + counts.outputTokens,
    request_count: Number(current.request_count || 0) + counts.requestCount,
    session_count: Number(current.session_count || 0) + counts.sessionCount,
    note_proposal_count:
      Number(current.note_proposal_count || 0) + counts.noteProposalCount,
  });

  if (updateError) {
    console.error("[token-usage] update failed", {
      action: "usage",
      requestId,
      userId,
      hasDeviceId: Boolean(deviceId),
      year,
      month,
      day,
      error: updateError,
    });
    return json(res, 500, { error: "Failed to update usage", details: updateError });
  }

  return json(res, 200, { ok: true });
};
