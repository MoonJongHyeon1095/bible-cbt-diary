import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createSupabaseAdminClient } from "../../supabase/adminNode.js";
import { resolveIdentityFromBody } from "../_identity.js";
import { json, readJson } from "../_utils.js";

// PATCH /api/emotion-behavior-history
// 행동 기록 수정
export const handlePatchEmotionBehaviorHistory = async (
  req: VercelRequest,
  res: VercelResponse,
) => {
  const payload = await readJson<{
    id?: number;
    tracked_on?: string;
    comments?: string;
    checks?: Array<{ check_id: number; is_done: boolean }>;
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

  const updatePayload: {
    tracked_on?: string;
    comments?: string;
  } = {};

  if (payload.tracked_on !== undefined) {
    const trackedAt = new Date(String(payload.tracked_on));
    if (Number.isNaN(trackedAt.getTime())) {
      return json(res, 400, { ok: false, message: "tracked_on이 올바르지 않습니다." });
    }
    updatePayload.tracked_on = String(payload.tracked_on);
  }
  if (payload.comments !== undefined) {
    updatePayload.comments = String(payload.comments ?? "").trim();
  }

  const checks =
    payload.checks === undefined
      ? undefined
      : Array.isArray(payload.checks)
      ? payload.checks
          .map((item) => ({
            check_id: Number(item?.check_id ?? ""),
            is_done: Boolean(item?.is_done),
          }))
          .filter((item) => Number.isFinite(item.check_id))
      : [];

  const supabase = createSupabaseAdminClient();
  const updateBaseQuery = supabase
    .from("emotion_behavior_history")
    .update(updatePayload)
    .eq("id", historyId);
  const { error } = user
    ? await updateBaseQuery.eq("user_id", user.id)
    : await updateBaseQuery.eq("device_id", deviceId).is("user_id", null);
  if (error) {
    return json(res, 500, { ok: false, message: "행동 기록 수정에 실패했습니다." });
  }

  if (checks !== undefined) {
    const { error: deleteError } = await supabase
      .from("emotion_behavior_history_checks")
      .delete()
      .eq("history_id", historyId);
    if (deleteError) {
      return json(res, 500, { ok: false, message: "체크 상태 초기화에 실패했습니다." });
    }

    if (checks.length > 0) {
      const rows = checks.map((item) => ({
        history_id: historyId,
        check_id: item.check_id,
        is_done: item.is_done,
      }));
      const { error: insertError } = await supabase
        .from("emotion_behavior_history_checks")
        .insert(rows);
      if (insertError) {
        return json(res, 500, { ok: false, message: "체크 상태 저장에 실패했습니다." });
      }
    }
  }

  return json(res, 200, { ok: true });
};
