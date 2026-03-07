import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createSupabaseAdminClient } from "../../supabase/adminNode.js";
import { resolveIdentityFromQuery } from "../_identity.js";
import { getQueryParam, json } from "../_utils.js";

// GET /api/emotion-notes?action=history&limit=...&offset=...
// emotion-notes 기록용 목록 조회
export const handleGetEmotionNoteHistoryList = async (
  req: VercelRequest,
  res: VercelResponse,
) => {
  const { user, deviceId } = await resolveIdentityFromQuery(req);
  if (!user && !deviceId) {
    return json(res, 401, { notes: [] });
  }

  const limitParam = Number(getQueryParam(req, "limit") ?? "50");
  const offsetParam = Number(getQueryParam(req, "offset") ?? "0");
  const limit = Number.isNaN(limitParam)
    ? 50
    : Math.min(Math.max(limitParam, 1), 100);
  const offset = Number.isNaN(offsetParam) ? 0 : Math.max(offsetParam, 0);

  const supabase = createSupabaseAdminClient();
  const baseQuery = supabase
    .from("emotion_notes")
    .select(
      `
        id,
        title,
        trigger_text,
        created_at,
        emotion_type,
        emotion_tags,
        inner_belief,
        error_label,
        error_description,
        alternative,
        sdt_type,
        sdt_empathy_text,
        reflection_question
      `,
    )
    .eq("is_history_represent", true)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  const scopedQuery = user
    ? baseQuery.eq("user_id", user.id)
    : baseQuery.eq("device_id", deviceId).is("user_id", null);

  const { data, error } = await scopedQuery;
  if (error) {
    return json(res, 500, { notes: [], message: "기록을 불러오지 못했습니다." });
  }

  return json(res, 200, {
    notes:
      data?.map((note) => ({
        id: note.id,
        title: note.title,
        trigger_text: note.trigger_text,
        created_at: note.created_at,
        emotion_type: note.emotion_type ?? "negative",
        emotion_tags: note.emotion_tags ?? [],
        inner_belief: note.inner_belief ?? "",
        error_label: note.error_label ?? "",
        error_description: note.error_description ?? "",
        alternative: note.alternative ?? "",
        sdt_type: note.sdt_type ?? "",
        sdt_empathy_text: note.sdt_empathy_text ?? "",
        reflection_question: note.reflection_question ?? "",
      })) ?? [],
  });
};
