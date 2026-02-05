import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createSupabaseAdminClient } from "../../supabase/adminNode.js";
import { getUserFromAuthHeader } from "../../auth/sessionNode.js";
import { json, readJson, normalizeDeviceId } from "../_utils.js";

export const handlePatchEmotionBehaviorDetails = async (
  req: VercelRequest,
  res: VercelResponse,
) => {
  const user = await getUserFromAuthHeader(req.headers.authorization);
  const payload = await readJson<{
    id?: number;
    behavior_label?: string;
    behavior_description?: string;
    error_tags?: string[];
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
    error_tags?: string[];
  } = {};

  if (payload.behavior_label !== undefined) {
    updatePayload.behavior_label = String(payload.behavior_label).trim();
  }
  if (payload.behavior_description !== undefined) {
    updatePayload.behavior_description = String(payload.behavior_description).trim();
  }
  if (payload.error_tags !== undefined) {
    updatePayload.error_tags = Array.isArray(payload.error_tags)
      ? payload.error_tags.map((tag) => String(tag))
      : [];
  }

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

  return json(res, 200, { ok: true });
};
