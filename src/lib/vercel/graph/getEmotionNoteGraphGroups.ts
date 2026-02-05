import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createSupabaseAdminClient } from "../../supabase/adminNode.js";
import { json } from "../_utils.js";
import { resolveIdentityFromQuery } from "../_identity.js";

export const handleGetEmotionFlows = async (
  req: VercelRequest,
  res: VercelResponse,
) => {
  const { user, deviceId } = await resolveIdentityFromQuery(req);
  if (!user && !deviceId) {
    return json(res, 401, { flows: [] });
  }

  const supabase = createSupabaseAdminClient();
  const baseQuery = supabase
    .from("emotion_flows")
    .select("id, created_at, emotion_flow_note_middles(count)")
    .order("created_at", { ascending: false });

  const scopedQuery = user
    ? baseQuery.eq("user_id", user.id)
    : baseQuery.eq("device_id", deviceId).is("user_id", null);

  const { data: flows, error } = await scopedQuery;

  if (error) {
    return json(res, 500, {
      flows: [],
      message: "플로우 정보를 불러오지 못했습니다.",
    });
  }

  const mappedFlows =
    flows?.map((flow) => ({
      id: flow.id,
      created_at: flow.created_at,
      note_count: flow.emotion_flow_note_middles?.[0]?.count ?? 0,
    })) ?? [];

  return json(res, 200, { flows: mappedFlows });
};
