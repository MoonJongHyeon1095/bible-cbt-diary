import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createSupabaseAdminClient } from "../../supabase/adminNode.js";
import { getQueryParam, json } from "../_utils.js";
import { resolveIdentityFromQuery } from "../_identity.js";

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
        emotion_flow_note_middles(flow_id),
        emotion_note_details(id,note_id,automatic_thought,emotion,created_at),
        emotion_error_details(id,note_id,error_label,error_description,created_at),
        emotion_alternative_details(id,note_id,alternative,created_at),
        emotion_behavior_details(
          id,
          note_id,
          behavior_label,
          behavior_description,
          error_tags,
          created_at
        )
      `,
    );

  const scopedQuery = user
    ? baseQuery.eq("user_id", user.id)
    : baseQuery.eq("device_id", deviceId).is("user_id", null);

  const { data, error } = await scopedQuery
    .eq("id", noteId)
    .order("created_at", {
      ascending: true,
      foreignTable: "emotion_note_details",
    })
    .order("created_at", {
      ascending: true,
      foreignTable: "emotion_error_details",
    })
    .order("created_at", {
      ascending: true,
      foreignTable: "emotion_alternative_details",
    })
    .order("created_at", {
      ascending: true,
      foreignTable: "emotion_behavior_details",
    })
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
        flow_ids: Array.from(
          new Set(
            (data.emotion_flow_note_middles ?? [])
              .map((detail) => Number(detail.flow_id))
              .filter((id) => Number.isFinite(id)),
          ),
        ),
        thought_details: data.emotion_note_details ?? [],
        error_details: data.emotion_error_details ?? [],
        alternative_details: data.emotion_alternative_details ?? [],
        behavior_details: data.emotion_behavior_details ?? [],
      }
    : null;

  return json(res, 200, { note });
};
