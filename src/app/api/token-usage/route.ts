import { getUserFromRequest } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
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
  const deviceId = body?.deviceId;
  const usage = body?.usage ?? {};
  const user = await getUserFromRequest(request);
  const userId = user?.id ?? null;

  if ((!deviceId || typeof deviceId !== "string") && !userId) {
    return NextResponse.json(
      { error: "deviceId or userId is required" },
      { status: 400 },
    );
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
    return NextResponse.json(
      { error: "invalid usage values" },
      { status: 400 },
    );
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
    return NextResponse.json({ ok: true }, { status: 200 });
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
    return NextResponse.json(
      { error: "Failed to update usage", details: error },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
