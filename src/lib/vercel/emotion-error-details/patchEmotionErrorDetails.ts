import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createSupabaseAdminClient } from "../../supabase/adminNode.js";
import { getUserFromAuthHeader } from "../../auth/sessionNode.js";
import { json, readJson, normalizeDeviceId } from "../_utils.js";

// PATCH /api/emotion-error-details
// emotion-error-details 수정
export const handlePatchEmotionErrorDetails = async (
  req: VercelRequest,
  res: VercelResponse,
) => {
  const user = await getUserFromAuthHeader(req.headers.authorization);
  const payload = await readJson<{
    id?: number;
    error_label?: string;
    error_description?: string;
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
    error_label?: string;
    error_description?: string;
  } = {};

  if (payload.error_label !== undefined) {
    updatePayload.error_label = String(payload.error_label).trim();
  }
  if (payload.error_description !== undefined) {
    updatePayload.error_description = String(payload.error_description).trim();
  }

  const supabase = createSupabaseAdminClient();
  const baseQuery = supabase
    .from("emotion_error_details")
    .update(updatePayload)
    .eq("id", detailId);

  const { error } = user
    ? await baseQuery.eq("user_id", user.id)
    : await baseQuery.eq("device_id", deviceId).is("user_id", null);

  if (error) {
    return json(res, 500, { ok: false, message: "에러 상세 수정에 실패했습니다." });
  }

  return json(res, 200, { ok: true });
};
