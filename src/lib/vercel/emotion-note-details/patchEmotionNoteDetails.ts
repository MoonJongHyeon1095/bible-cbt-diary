import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createSupabaseAdminClient } from "../../supabase/adminNode.js";
import { getUserFromAuthHeader } from "../../auth/sessionNode.js";
import { json, readJson, normalizeDeviceId } from "../_utils.js";

// PATCH /api/emotion-note-details
// emotion-note-details 수정
export const handlePatchEmotionNoteDetails = async (
  req: VercelRequest,
  res: VercelResponse,
) => {
  const user = await getUserFromAuthHeader(req.headers.authorization);
  const payload = await readJson<{
    id?: number;
    automatic_thought?: string;
    emotion?: string;
    deviceId?: string;
  }>(req);

  const deviceId = normalizeDeviceId(payload.deviceId);
  if (!user && !deviceId) {
    return json(res, 401, { ok: false, message: "로그인이 필요합니다." });
  }

  const detailId = Number(payload.id ?? "");
  if (Number.isNaN(detailId)) {
    return json(res, 400, { ok: false, message: "id가 필요합니다." });
  }

  const updatePayload: {
    automatic_thought?: string;
    emotion?: string;
  } = {};

  if (payload.automatic_thought !== undefined) {
    updatePayload.automatic_thought = String(payload.automatic_thought).trim();
  }
  if (payload.emotion !== undefined) {
    updatePayload.emotion = String(payload.emotion).trim();
  }

  const supabase = createSupabaseAdminClient();
  const baseQuery = supabase
    .from("emotion_note_details")
    .update(updatePayload)
    .eq("id", detailId);

  const { error } = user
    ? await baseQuery.eq("user_id", user.id)
    : await baseQuery.eq("device_id", deviceId).is("user_id", null);

  if (error) {
    return json(res, 500, { ok: false, message: "상세 수정에 실패했습니다." });
  }

  return json(res, 200, { ok: true });
};
