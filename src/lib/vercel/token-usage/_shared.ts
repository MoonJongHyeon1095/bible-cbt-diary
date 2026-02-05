import { createSupabaseAdminClient } from "../../supabase/adminNode.js";
import { json } from "../_utils.js";
import type { VercelResponse } from "@vercel/node";

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

export function getUtcDateParts(): UtcDateParts {
  const now = new Date();
  return {
    year: now.getUTCFullYear(),
    month: now.getUTCMonth() + 1,
    day: now.getUTCDate(),
  };
}

export function parseUsageCounts(usage: UsagePayload): UsageCounts | null {
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

export function isZeroUsage(counts: UsageCounts) {
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

export function applyIdentityFilter<T extends { eq: (col: string, val: unknown) => T }>(
  query: T,
  userId: string | null,
  deviceId: string | null,
) {
  if (userId) {
    return query.eq("user_id", userId);
  }
  return query.eq("device_id", deviceId);
}

export async function getLatestTokenUsageRow(
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

export async function insertTokenUsageRow(
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

export async function updateTokenUsageRow(
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

export function logMissingIdentity(
  res: VercelResponse,
  params: {
    action: string;
    requestId: string | string[] | undefined;
    hasDeviceId: boolean;
    hasUserId: boolean;
  },
) {
  console.error("[token-usage] missing identity", params);
  return json(res, 400, { error: "deviceId or userId is required" });
}
