import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createSupabaseAdminClient } from "../src/lib/supabase/adminNode.js";
import { getUserFromAuthHeader } from "../src/lib/auth/sessionNode.js";
import { json, methodNotAllowed, readJson, handleCors } from "./_utils.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  if (req.method !== "POST") {
    return methodNotAllowed(res);
  }

  const body = await readTokenUsageBody(req);
  const deviceId = normalizeDeviceId(body.deviceId);
  const usage = body.usage ?? {};
  const action = body.action;
  const user = await getUserFromAuthHeader(req.headers.authorization);
  const userId = user?.id ?? null;
  const requestId = req.headers["x-request-id"];
  const perf = null;

  if (!deviceId && !userId) {
    console.error("[token-usage] missing identity", {
      action,
      requestId,
      hasDeviceId: Boolean(deviceId),
      hasUserId: Boolean(userId),
    });
    return json(res, 400, { error: "deviceId or userId is required" });
  }

  if (action === "status") {
    return handleStatusRequest(res, {
      deviceId,
      userId,
      requestId,
    });
  }

  return handleUsageRequest(res, {
    deviceId,
    userId,
    requestId,
    usage,
  });
}

type TokenUsageBody = {
  action?: "status";
  deviceId?: string;
  usage?: UsagePayload;
};

type UsagePayload = {
  total_tokens?: number;
  input_tokens?: number;
  output_tokens?: number;
  request_count?: number;
  session_count?: number;
  note_proposal_count?: number;
};

type UsageCounts = {
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  requestCount: number;
  sessionCount: number;
  noteProposalCount: number;
};

type UtcDateParts = {
  year: number;
  month: number;
  day: number;
};

async function readTokenUsageBody(req: VercelRequest): Promise<TokenUsageBody> {
  return readJson<TokenUsageBody>(req);
}

function normalizeDeviceId(deviceId?: string) {
  return typeof deviceId === "string" ? deviceId : null;
}

function getUtcDateParts(): UtcDateParts {
  const now = new Date();
  return {
    year: now.getUTCFullYear(),
    month: now.getUTCMonth() + 1,
    day: now.getUTCDate(),
  };
}

async function handleStatusRequest(
  res: VercelResponse,
  params: {
    deviceId: string | null;
    userId: string | null;
    requestId: string | string[] | undefined;
  },
) {
  const { deviceId, userId, requestId } = params;
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
}

async function handleUsageRequest(
  res: VercelResponse,
  params: {
    deviceId: string | null;
    userId: string | null;
    requestId: string | string[] | undefined;
    usage: UsagePayload;
  },
) {
  const { deviceId, userId, requestId, usage } = params;
  const resolvedDeviceId = userId ? null : deviceId;
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

  const { data: latest, error: latestError } = await getLatestTokenUsageRow(
    supabase,
    userId,
    resolvedDeviceId,
  );

  if (latestError) {
    console.error("[token-usage] latest query failed", {
      action: "usage",
      requestId,
      userId,
      hasDeviceId: Boolean(deviceId),
      year,
      month,
      day,
      error: latestError,
    });
    return json(res, 500, { error: "Failed to read usage", details: latestError });
  }

  if (!latest || latest.year !== year || latest.month !== month) {
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
      return json(res, 500, {
        error: "Failed to update usage",
        details: insertError,
      });
    }

    return json(res, 200, { ok: true });
  }

  const latestDay = Number(latest.day || 0);
  if (day < latestDay) {
    return json(res, 200, { ok: true });
  }

  const shouldResetDaily = day > latestDay;
  const nextDailyUsage = shouldResetDaily
    ? counts.totalTokens
    : Number(latest.daily_usage || 0) + counts.totalTokens;

  const { error: updateError } = await updateTokenUsageRow(supabase, latest.id, {
    day,
    monthly_usage: Number(latest.monthly_usage || 0) + counts.totalTokens,
    daily_usage: nextDailyUsage,
    input_tokens: Number(latest.input_tokens || 0) + counts.inputTokens,
    output_tokens: Number(latest.output_tokens || 0) + counts.outputTokens,
    request_count: Number(latest.request_count || 0) + counts.requestCount,
    session_count: Number(latest.session_count || 0) + counts.sessionCount,
    note_proposal_count:
      Number(latest.note_proposal_count || 0) + counts.noteProposalCount,
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
}

function parseUsageCounts(usage: UsagePayload): UsageCounts | null {
  const totalTokensRaw = Number(usage?.total_tokens || 0);
  const inputTokens = Number(usage?.input_tokens || 0);
  const outputTokens = Number(usage?.output_tokens || 0);
  const totalTokens = totalTokensRaw || inputTokens + outputTokens;
  const requestCount = Number(usage?.request_count || 0);
  const sessionCount = Number(usage?.session_count || 0);
  const noteProposalCount = Number(usage?.note_proposal_count || 0);

  const values = [
    totalTokens,
    inputTokens,
    outputTokens,
    requestCount,
    sessionCount,
    noteProposalCount,
  ];

  if (values.some((value) => !Number.isFinite(value) || value < 0)) {
    return null;
  }

  return {
    totalTokens,
    inputTokens,
    outputTokens,
    requestCount,
    sessionCount,
    noteProposalCount,
  };
}

function isZeroUsage(counts: UsageCounts) {
  return (
    counts.totalTokens +
      counts.inputTokens +
      counts.outputTokens +
      counts.requestCount +
      counts.sessionCount +
      counts.noteProposalCount ===
    0
  );
}

function applyIdentityFilter<T extends { eq: (col: string, val: unknown) => T }>(
  query: T,
  userId: string | null,
  deviceId: string | null,
) {
  if (userId) {
    return query.eq("user_id", userId);
  }
  return query.eq("device_id", deviceId);
}

type LatestTokenUsageRow = {
  id: number;
  year: number;
  month: number;
  day: number;
  monthly_usage: number | null;
  daily_usage: number | null;
  input_tokens: number | null;
  output_tokens: number | null;
  request_count: number | null;
  session_count: number | null;
  note_proposal_count: number | null;
};

async function getLatestTokenUsageRow(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  userId: string | null,
  deviceId: string | null,
) {
  let query = supabase
    .from("token_usages")
    .select(
      "id, year, month, day, monthly_usage, daily_usage, input_tokens, output_tokens, request_count, session_count, note_proposal_count",
    )
    .order("year", { ascending: false })
    .order("month", { ascending: false })
    .order("day", { ascending: false })
    .limit(1);

  if (userId) {
    query = query.eq("user_id", userId);
  } else {
    query = query.eq("device_id", deviceId);
  }

  return query.maybeSingle<LatestTokenUsageRow>();
}

async function insertTokenUsageRow(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  params: {
    userId: string | null;
    deviceId: string | null;
    year: number;
    month: number;
    day: number;
    totalTokens: number;
    inputTokens: number;
    outputTokens: number;
    requestCount: number;
    sessionCount: number;
    noteProposalCount: number;
  },
) {
  return supabase.from("token_usages").insert({
    user_id: params.userId,
    device_id: params.deviceId,
    year: params.year,
    month: params.month,
    day: params.day,
    monthly_usage: params.totalTokens,
    daily_usage: params.totalTokens,
    input_tokens: params.inputTokens,
    output_tokens: params.outputTokens,
    request_count: params.requestCount,
    session_count: params.sessionCount,
    note_proposal_count: params.noteProposalCount,
  });
}

async function updateTokenUsageRow(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  id: number,
  values: {
    day: number;
    monthly_usage: number;
    daily_usage: number;
    input_tokens: number;
    output_tokens: number;
    request_count: number;
    session_count: number;
    note_proposal_count: number;
  },
) {
  return supabase.from("token_usages").update(values).eq("id", id);
}
