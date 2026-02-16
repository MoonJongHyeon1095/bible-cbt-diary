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

  const noteIdParam = getQueryParam(req, "noteId");
  const noteId =
    noteIdParam && noteIdParam.trim().length > 0 ? Number(noteIdParam) : null;
  if (noteIdParam && Number.isNaN(noteId)) {
    return json(res, 400, { flows: [], message: "noteId가 올바르지 않습니다." });
  }

  const supabase = createSupabaseAdminClient();
  let scopedFlowIds: number[] | null = null;

  if (noteId !== null) {
    const { data: flowNoteRows, error: flowNoteError } = await supabase
      .from("emotion_flow_note_middles")
      .select("flow_id")
      .eq("note_id", noteId);

    if (flowNoteError) {
      return json(res, 500, {
        flows: [],
        message: "노트 기반 플로우를 불러오지 못했습니다.",
      });
    }

    scopedFlowIds = Array.from(
      new Set(
        (flowNoteRows ?? [])
          .map((row) => Number(row.flow_id))
          .filter((id) => Number.isFinite(id)),
      ),
    );

    if (scopedFlowIds.length === 0) {
      return json(res, 200, { flows: [] });
    }
  }

  const baseQuery = supabase
    .from("emotion_flows")
    .select("id, created_at, title, description, emotion_flow_note_middles(count)")
    .order("created_at", { ascending: false });

  const ownerScopedQuery = user
    ? baseQuery.eq("user_id", user.id)
    : baseQuery.eq("device_id", deviceId).is("user_id", null);

  const scopedQuery =
    scopedFlowIds !== null ? ownerScopedQuery.in("id", scopedFlowIds) : ownerScopedQuery;

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
      title: flow.title ?? "",
      description: flow.description ?? null,
    })) ?? [];

  return json(res, 200, { flows: mappedFlows });
};
