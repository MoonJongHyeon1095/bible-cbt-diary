import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createSupabaseAdminClient } from "../../supabase/adminNode.js";
import { getQueryParam, json } from "../_utils.js";
import { resolveIdentityFromQuery } from "../_identity.js";

const parseNoteId = (req: VercelRequest) => {
  const noteIdParam = getQueryParam(req, "note_id");
  const noteId = Number(noteIdParam ?? "");
  return Number.isNaN(noteId) ? null : noteId;
};

// GET /api/emotion-note-details
// emotion-note-details 상세 조회
export const handleGetEmotionNoteDetails = async (
  req: VercelRequest,
  res: VercelResponse,
) => {
  const { user, deviceId } = await resolveIdentityFromQuery(req);
  if (!user && !deviceId) {
    return json(res, 401, { details: [] });
  }

  const noteId = parseNoteId(req);
  if (!noteId) {
    return json(res, 400, { details: [], message: "note_id가 필요합니다." });
  }

  const supabase = createSupabaseAdminClient();
  const baseQuery = supabase
    .from("emotion_note_details")
    .select("id,note_id,automatic_thought,emotion,created_at")
    .eq("note_id", noteId)
    .order("created_at", { ascending: true });

  const scopedQuery = user
    ? baseQuery.eq("user_id", user.id)
    : baseQuery.eq("device_id", deviceId).is("user_id", null);

  const { data, error } = await scopedQuery;

  if (error) {
    return json(res, 500, { details: [], message: "상세 정보를 불러오지 못했습니다." });
  }

  return json(res, 200, { details: data ?? [] });
};
