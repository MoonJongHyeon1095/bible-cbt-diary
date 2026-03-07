import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createSupabaseAdminClient } from "../../supabase/adminNode.js";
import { getUserFromAuthHeader } from "../../auth/sessionNode.js";
import { json, readJson, normalizeDeviceId } from "../_utils.js";

// POST /api/device-merge
// device-merge 등록
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
    const { data: deviceHistoryRows, error: deviceHistoryError } = await supabase
      .from("emotion_behavior_history")
      .select("id,tracked_on")
      .eq("device_id", deviceId)
      .is("user_id", null);
    if (deviceHistoryError) {
      return json(res, 500, { ok: false, message: "데이터 병합에 실패했습니다." });
    }

    const { data: userHistoryRows, error: userHistoryError } = await supabase
      .from("emotion_behavior_history")
      .select("id,tracked_on")
      .eq("user_id", user.id);
    if (userHistoryError) {
      return json(res, 500, { ok: false, message: "데이터 병합에 실패했습니다." });
    }

    const userHistoryKeys = new Set(
      (userHistoryRows ?? []).map(
        (row) => row.tracked_on,
      ),
    );
    const conflictDeviceHistoryIds = (deviceHistoryRows ?? [])
      .filter((row) =>
        userHistoryKeys.has(row.tracked_on),
      )
      .map((row) => row.id);

    if (conflictDeviceHistoryIds.length > 0) {
      const { error: deleteConflictError } = await supabase
        .from("emotion_behavior_history")
        .delete()
        .in("id", conflictDeviceHistoryIds);
      if (deleteConflictError) {
        return json(res, 500, { ok: false, message: "데이터 병합에 실패했습니다." });
      }
    }

    const tables = [
      "emotion_notes",
      "emotion_behavior_details",
      "emotion_behavior_checks",
      "emotion_behavior_history",
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
