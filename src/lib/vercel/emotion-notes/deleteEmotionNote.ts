import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createSupabaseAdminClient } from "../../supabase/adminNode.js";
import { getUserFromAuthHeader } from "../../auth/sessionNode.js";
import { json, readJson, normalizeDeviceId } from "../_utils.js";

export const handleDeleteEmotionNote = async (
  req: VercelRequest,
  res: VercelResponse,
) => {
  const requestId = req.headers["x-request-id"];
  const user = await getUserFromAuthHeader(req.headers.authorization);
  const payload = await readJson<{ id?: number; deviceId?: string }>(req);

  const deviceId = normalizeDeviceId(payload.deviceId);
  if (!user && !deviceId) {
    return json(res, 401, { ok: false, message: "로그인이 필요합니다." });
  }

  const noteId = Number(payload.id ?? "");
  if (Number.isNaN(noteId)) {
    return json(res, 400, { ok: false, message: "id가 필요합니다." });
  }

  const supabase = createSupabaseAdminClient();
  const baseQuery = supabase
    .from("emotion_notes")
    .delete()
    .eq("id", noteId);

  const { error } = user
    ? await baseQuery.eq("user_id", user.id)
    : await baseQuery.eq("device_id", deviceId).is("user_id", null);

  if (error) {
    console.error("[emotion-notes] delete failed", {
      requestId,
      userId: user?.id ?? null,
      noteId,
      error,
    });
    return json(res, 500, { ok: false, message: "기록 삭제에 실패했습니다." });
  }

  return json(res, 200, { ok: true });
};
