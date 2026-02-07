import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createSupabaseAdminClient } from "../../supabase/adminNode.js";
import { getUserFromAuthHeader } from "../../auth/sessionNode.js";
import { json, normalizeDeviceId } from "../_utils.js";

// GET /api/device-merge
// device-merge 조회
export const handleGetDeviceMerge = async (
  req: VercelRequest,
  res: VercelResponse,
) => {
  const user = await getUserFromAuthHeader(req.headers.authorization);
  if (!user) {
    return json(res, 401, { ok: false, message: "로그인이 필요합니다." });
  }

  const deviceId = normalizeDeviceId(
    typeof req.query.deviceId === "string" ? req.query.deviceId : "",
  );
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
      const { data, error } = await supabase
        .from(table)
        .select("id")
        .eq("device_id", deviceId)
        .is("user_id", null)
        .limit(1);

      if (error) {
        return json(res, 500, {
          ok: false,
          message: "기기 기록 확인에 실패했습니다.",
        });
      }

      if (data && data.length > 0) {
        return json(res, 200, { ok: true, hasData: true });
      }
    }

    return json(res, 200, { ok: true, hasData: false });
  } catch (error) {
    console.error("[/api/device-merge] check error:", error);
    return json(res, 500, { ok: false, message: "기기 기록 확인에 실패했습니다." });
  }
};
