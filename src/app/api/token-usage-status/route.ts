import { getUserFromRequest } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    deviceId?: string;
  };
  const deviceId = body?.deviceId;
  const user = await getUserFromRequest(request);
  const userId = user?.id ?? null;

  if ((!deviceId || typeof deviceId !== "string") && !userId) {
    return NextResponse.json(
      { error: "deviceId or userId is required" },
      { status: 400 },
    );
  }

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
    return NextResponse.json(
      { error: "Failed to read usage", details: error },
      { status: 500 },
    );
  }

  const dailyUsage = data?.day === day ? Number(data?.daily_usage || 0) : 0;
  const monthlyUsage = Number(data?.monthly_usage || 0);

  return NextResponse.json(
    {
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
    },
    { status: 200 },
  );
}
