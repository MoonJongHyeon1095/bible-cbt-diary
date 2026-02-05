import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createSupabaseAdminClient } from "../../supabase/adminNode.js";
import { getUserFromAuthHeader } from "../../auth/sessionNode.js";
import { json, readJson, normalizeDeviceId, getQueryParam } from "../_utils.js";

export const handleDeleteSessionHistory = async (
  req: VercelRequest,
  res: VercelResponse,
) => {
  const user = await getUserFromAuthHeader(req.headers.authorization);
  const payload = await readJson<{ id?: string | number; deviceId?: string }>(req);
  const idParam = payload.id ?? getQueryParam(req, "id");

  const deviceId = normalizeDeviceId(payload.deviceId);
  if (!user && !deviceId) {
    return json(res, 401, { ok: false, message: "로그인이 필요합니다." });
  }

  const historyId = Number(idParam ?? "");
  if (Number.isNaN(historyId)) {
    return json(res, 400, { ok: false, message: "id가 올바르지 않습니다." });
  }

  const supabase = createSupabaseAdminClient();
  const baseQuery = supabase
    .from("session_history")
    .update({ soft_deleted_at: new Date().toISOString() })
    .is("soft_deleted_at", null);

  const scopedBaseQuery = user
    ? baseQuery.eq("user_id", user.id)
    : baseQuery.eq("device_id", deviceId).is("user_id", null);

  const { error } = await scopedBaseQuery.eq("id", historyId);

  if (error) {
    return json(res, 500, { ok: false, message: "세션 기록을 삭제하지 못했습니다." });
  }

  return json(res, 200, { ok: true });
};
