import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createSupabaseAdminClient } from "../../supabase/adminNode.js";
import { getUserFromAuthHeader } from "../../auth/sessionNode.js";
import { json, readJson, normalizeDeviceId } from "../_utils.js";

// PATCH /api/emotion-notes?action=hide-all-history
// history 목록 전체 숨김
export const handleHideAllEmotionNotesFromHistory = async (
  req: VercelRequest,
  res: VercelResponse,
) => {
  const user = await getUserFromAuthHeader(req.headers.authorization);
  const payload = await readJson<{ deviceId?: string }>(req);
  const deviceId = normalizeDeviceId(payload.deviceId);

  if (!user && !deviceId) {
    return json(res, 401, { ok: false, message: "로그인이 필요합니다." });
  }

  const supabase = createSupabaseAdminClient();
  const baseQuery = supabase
    .from("emotion_notes")
    .update({
      is_history_represent: false,
      updated_at: new Date().toISOString(),
    })
    .eq("is_history_represent", true);

  const { error } = user
    ? await baseQuery.eq("user_id", user.id)
    : await baseQuery.eq("device_id", deviceId).is("user_id", null);

  if (error) {
    return json(res, 500, { ok: false, message: "기록 숨김에 실패했습니다." });
  }

  return json(res, 200, { ok: true });
};
