import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createSupabaseAdminClient } from "../../supabase/adminNode.js";
import { resolveIdentityFromBody } from "../_identity.js";
import { json, readJson } from "../_utils.js";

// DELETE /api/emotion-behavior-history
// 행동 기록 삭제
export const handleDeleteEmotionBehaviorHistory = async (
  req: VercelRequest,
  res: VercelResponse,
) => {
  const payload = await readJson<{
    id?: number;
    deviceId?: string;
  }>(req);
  const { user, deviceId } = await resolveIdentityFromBody(req, payload.deviceId);
  if (!user && !deviceId) {
    return json(res, 401, { ok: false, message: "로그인이 필요합니다." });
  }

  const historyId = Number(payload.id ?? "");
  if (!Number.isFinite(historyId)) {
    return json(res, 400, { ok: false, message: "id가 필요합니다." });
  }

  const supabase = createSupabaseAdminClient();
  const { data: ownerRow, error: ownerError } = user
    ? await supabase
        .from("emotion_behavior_history")
        .select("id")
        .eq("id", historyId)
        .eq("user_id", user.id)
        .maybeSingle()
    : await supabase
        .from("emotion_behavior_history")
        .select("id")
        .eq("id", historyId)
        .eq("device_id", deviceId)
        .is("user_id", null)
        .maybeSingle();
  if (ownerError || !ownerRow) {
    return json(res, 404, { ok: false, message: "삭제할 기록을 찾을 수 없습니다." });
  }

  const { error: checkDeleteError } = await supabase
    .from("emotion_behavior_history_checks")
    .delete()
    .eq("history_id", historyId);
  if (checkDeleteError) {
    return json(res, 500, { ok: false, message: "행동 기록 삭제에 실패했습니다." });
  }

  const deleteQuery = supabase
    .from("emotion_behavior_history")
    .delete()
    .eq("id", historyId);
  const { error } = user
    ? await deleteQuery.eq("user_id", user.id)
    : await deleteQuery.eq("device_id", deviceId).is("user_id", null);

  if (error) {
    return json(res, 500, { ok: false, message: "행동 기록 삭제에 실패했습니다." });
  }

  return json(res, 200, { ok: true });
};
