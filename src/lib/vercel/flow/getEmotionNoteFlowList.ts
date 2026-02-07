import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createSupabaseAdminClient } from "../../supabase/adminNode.js";
import { resolveIdentityFromQuery } from "../_identity.js";
import { getQueryParam, json } from "../_utils.js";

// GET /api/emotion-flow?action=list
// flow 목록 조회
export const handleGetEmotionFlowList = async (
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

  const noteIdParam = getQueryParam(req, "noteId");
  const noteId = noteIdParam ? Number(noteIdParam) : null;
  if (noteIdParam && (noteId === null || Number.isNaN(noteId))) {
    return json(res, 400, {
      flows: [],
      message: "noteId가 올바르지 않습니다.",
    });
  }

  let filteredQuery = scopedQuery;
  if (noteId) {
    const { data: linkedFlows, error: linkError } = await supabase
      .from("emotion_flow_note_middles")
      .select("flow_id")
      .eq("note_id", noteId);
    if (linkError) {
      return json(res, 500, {
        flows: [],
        message: "플로우 정보를 불러오지 못했습니다.",
      });
    }
    const flowIds = Array.from(
      new Set(
        (linkedFlows ?? [])
          .map((row) => Number(row.flow_id))
          .filter((id) => Number.isFinite(id)),
      ),
    );
    if (flowIds.length === 0) {
      return json(res, 200, { flows: [] });
    }
    filteredQuery = filteredQuery.in("id", flowIds);
  }

  const { data: flows, error } = await filteredQuery;

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
