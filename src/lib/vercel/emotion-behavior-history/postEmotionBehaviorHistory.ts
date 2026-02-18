import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createSupabaseAdminClient } from "../../supabase/adminNode.js";
import { resolveIdentityFromBody } from "../_identity.js";
import { json, readJson } from "../_utils.js";

// POST /api/emotion-behavior-history
// 행동 기록 등록
export const handlePostEmotionBehaviorHistory = async (
  req: VercelRequest,
  res: VercelResponse,
) => {
  const payload = await readJson<{
    behavior_detail_id?: number;
    tracked_on?: string;
    comments?: string;
    checks?: Array<{ check_id: number; is_done: boolean }>;
    deviceId?: string;
  }>(req);
  const { user, deviceId } = await resolveIdentityFromBody(req, payload.deviceId);
  if (!user && !deviceId) {
    return json(res, 401, { ok: false, message: "로그인이 필요합니다." });
  }

  const behaviorDetailId = Number(payload.behavior_detail_id ?? "");
  if (!Number.isFinite(behaviorDetailId)) {
    return json(res, 400, { ok: false, message: "behavior_detail_id가 필요합니다." });
  }

  const trackedOn = payload.tracked_on ? String(payload.tracked_on) : new Date().toISOString().slice(0, 10);
  const trackedAt = new Date(trackedOn);
  if (Number.isNaN(trackedAt.getTime())) {
    return json(res, 400, { ok: false, message: "tracked_on이 올바르지 않습니다." });
  }

  const comments = String(payload.comments ?? "").trim();
  const checks = Array.isArray(payload.checks)
    ? payload.checks
        .map((item) => ({
          check_id: Number(item?.check_id ?? ""),
          is_done: Boolean(item?.is_done),
        }))
        .filter((item) => Number.isFinite(item.check_id))
    : [];

  const supabase = createSupabaseAdminClient();
  const { data: inserted, error } = await supabase
    .from("emotion_behavior_history")
    .insert({
      behavior_detail_id: behaviorDetailId,
      tracked_on: trackedOn,
      comments,
      user_id: user ? user.id : null,
      device_id: user ? null : deviceId,
    })
    .select("id")
    .maybeSingle();

  if (error || !inserted) {
    return json(res, 500, { ok: false, message: "행동 기록 저장에 실패했습니다." });
  }

  if (checks.length > 0) {
    const rows = checks.map((item) => ({
      history_id: inserted.id,
      check_id: item.check_id,
      is_done: item.is_done,
    }));
    const { error: checkError } = await supabase
      .from("emotion_behavior_history_checks")
      .insert(rows);
    if (checkError) {
      return json(res, 500, { ok: false, message: "체크 상태 저장에 실패했습니다." });
    }
  }

  return json(res, 200, { ok: true, id: inserted.id });
};
