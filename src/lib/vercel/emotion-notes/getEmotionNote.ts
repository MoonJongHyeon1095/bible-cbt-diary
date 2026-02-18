import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createSupabaseAdminClient } from "../../supabase/adminNode.js";
import { getQueryParam, json } from "../_utils.js";
import { resolveIdentityFromQuery } from "../_identity.js";

// GET /api/emotion-notes?action=detail&id=...
// emotion-notes 상세 조회
export const handleGetEmotionNote = async (
  req: VercelRequest,
  res: VercelResponse,
) => {
  const requestId = req.headers["x-request-id"];
  const { user, deviceId } = await resolveIdentityFromQuery(req);
  if (!user && !deviceId) {
    return json(res, 401, { note: null });
  }

  const idParam = getQueryParam(req, "id");
  const noteId = Number(idParam ?? "");
  if (Number.isNaN(noteId)) {
    return json(res, 400, { note: null, message: "id가 올바르지 않습니다." });
  }

  const supabase = createSupabaseAdminClient();
  const baseQuery = supabase
    .from("emotion_notes")
    .select(
      `
        id,
        title,
        trigger_text,
        created_at,
        emotion_tags,
        inner_belief,
        error_label,
        error_description,
        alternative,
        emotion_flow_note_middles(flow_id)
      `,
    );

  const scopedQuery = user
    ? baseQuery.eq("user_id", user.id)
    : baseQuery.eq("device_id", deviceId).is("user_id", null);

  const { data, error } = await scopedQuery
    .eq("id", noteId)
    .maybeSingle();

  if (error) {
    console.error("[emotion-notes] detail query failed", {
      requestId,
      userId: user?.id ?? null,
      noteId,
      error,
    });
    return json(res, 500, {
      note: null,
      message: "노트를 불러오지 못했습니다.",
    });
  }

  const note = data
    ? {
        id: data.id,
        title: data.title,
        trigger_text: data.trigger_text,
        created_at: data.created_at,
        emotion_tags: data.emotion_tags ?? [],
        inner_belief: data.inner_belief ?? "",
        error_label: data.error_label ?? "",
        error_description: data.error_description ?? "",
        alternative: data.alternative ?? "",
        emotion_labels: data.emotion_tags ?? [],
        error_labels: data.error_label ? [data.error_label] : [],
        flow_ids: Array.from(
          new Set(
            (data.emotion_flow_note_middles ?? [])
              .map((detail) => Number(detail.flow_id))
              .filter((id) => Number.isFinite(id)),
          ),
        ),
        thought_details: data.inner_belief
          ? [
              {
                id: data.id,
                note_id: data.id,
                automatic_thought: data.inner_belief,
                emotion: (data.emotion_tags ?? []).join(", "),
                created_at: data.created_at,
              },
            ]
          : [],
        error_details: data.error_label || data.error_description
          ? [
              {
                id: data.id,
                note_id: data.id,
                error_label: data.error_label ?? "",
                error_description: data.error_description ?? "",
                created_at: data.created_at,
              },
            ]
          : [],
        alternative_details: data.alternative
          ? [
              {
                id: data.id,
                note_id: data.id,
                alternative: data.alternative,
                created_at: data.created_at,
              },
            ]
          : [],
        behavior_details: [],
      }
    : null;

  return json(res, 200, { note });
};
