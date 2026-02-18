import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createSupabaseAdminClient } from "../../supabase/adminNode.js";
import { getUserFromAuthHeader } from "../../auth/sessionNode.js";
import { json, readJson, normalizeDeviceId } from "../_utils.js";

// PATCH /api/emotion-behavior-details
// emotion-behavior-details 수정
export const handlePatchEmotionBehaviorDetails = async (
  req: VercelRequest,
  res: VercelResponse,
) => {
  const user = await getUserFromAuthHeader(req.headers.authorization);
  const payload = await readJson<{
    id?: number;
    behavior_label?: string;
    behavior_description?: string;
    checks?: string[];
    is_pinned?: boolean;
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
    behavior_label?: string;
    behavior_description?: string;
    is_pinned?: boolean;
  } = {};

  if (payload.behavior_label !== undefined) {
    updatePayload.behavior_label = String(payload.behavior_label).trim();
  }
  if (payload.behavior_description !== undefined) {
    updatePayload.behavior_description = String(payload.behavior_description).trim();
  }
  if (payload.is_pinned !== undefined) {
    updatePayload.is_pinned = Boolean(payload.is_pinned);
  }
  const checks =
    payload.checks === undefined
      ? undefined
      : Array.isArray(payload.checks)
      ? payload.checks
          .map((item) => String(item ?? "").trim())
          .filter((item) => item.length > 0)
          .slice(0, 3)
      : [];

  const supabase = createSupabaseAdminClient();
  const baseQuery = supabase
    .from("emotion_behavior_details")
    .update(updatePayload)
    .eq("id", detailId);

  const { error } = user
    ? await baseQuery.eq("user_id", user.id)
    : await baseQuery.eq("device_id", deviceId).is("user_id", null);

  if (error) {
    return json(res, 500, { ok: false, message: "행동 상세 수정에 실패했습니다." });
  }

  if (checks !== undefined) {
    const deleteBaseQuery = supabase
      .from("emotion_behavior_checks")
      .delete()
      .eq("behavior_detail_id", detailId);
    const { error: deleteError } = user
      ? await deleteBaseQuery.eq("user_id", user.id)
      : await deleteBaseQuery.eq("device_id", deviceId).is("user_id", null);
    if (deleteError) {
      return json(res, 500, { ok: false, message: "체크리스트 초기화에 실패했습니다." });
    }

    if (checks.length > 0) {
      const rows = checks.map((checkLabel, index) => ({
        behavior_detail_id: detailId,
        check_label: checkLabel,
        sort_order: index,
        user_id: user ? user.id : null,
        device_id: user ? null : deviceId,
      }));
      const { error: insertError } = await supabase
        .from("emotion_behavior_checks")
        .insert(rows);
      if (insertError) {
        return json(res, 500, { ok: false, message: "체크리스트 저장에 실패했습니다." });
      }
    }
  }

  return json(res, 200, { ok: true });
};
