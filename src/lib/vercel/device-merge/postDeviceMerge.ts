import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createSupabaseAdminClient } from "../../supabase/adminNode.js";
import { getUserFromAuthHeader } from "../../auth/sessionNode.js";
import { json, readJson, normalizeDeviceId } from "../_utils.js";

export const handlePostDeviceMerge = async (
  req: VercelRequest,
  res: VercelResponse,
) => {
  const user = await getUserFromAuthHeader(req.headers.authorization);
  if (!user) {
    return json(res, 401, { ok: false, message: "로그인이 필요합니다." });
  }

  const payload = await readJson<{ deviceId?: string }>(req);
  const deviceId = normalizeDeviceId(payload.deviceId);
  if (!deviceId) {
    return json(res, 400, { ok: false, message: "deviceId가 필요합니다." });
  }

  try {
    const supabase = createSupabaseAdminClient();

    const tables = [
      "emotion_notes",
      "emotion_note_details",
      "emotion_error_details",
      "emotion_alternative_details",
      "emotion_behavior_details",
      "session_history",
      "emotion_flows",
    ];

    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .update({ user_id: user.id, device_id: null })
        .eq("device_id", deviceId)
        .is("user_id", null);

      if (error) {
        return json(res, 500, { ok: false, message: "데이터 병합에 실패했습니다." });
      }
    }

    return json(res, 200, { ok: true });
  } catch (error) {
    console.error("[/api/device-merge] error:", error);
    return json(res, 500, { ok: false, message: "데이터 병합에 실패했습니다." });
  }
};
