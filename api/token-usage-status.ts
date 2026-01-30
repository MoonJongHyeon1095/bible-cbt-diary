import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createSupabaseAdminClient } from "../src/lib/supabase/admin";
import { getUserFromAuthHeader } from "../src/lib/auth/session";
import { json, methodNotAllowed, readJson, handleCors } from "./_utils";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  if (req.method !== "POST") {
    return methodNotAllowed(res);
  }

  const body = await readJson<{ deviceId?: string }>(req);
  const deviceId = body?.deviceId;
  const user = await getUserFromAuthHeader(req.headers.authorization);
  const userId = user?.id ?? null;

  if ((!deviceId || typeof deviceId !== "string") && !userId) {
    return json(res, 400, { error: "deviceId or userId is required" });
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
