import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createSupabaseAdminClient } from "../../supabase/adminNode.js";
import { getUserFromAuthHeader } from "../../auth/sessionNode.js";
import { json, readJson, normalizeDeviceId } from "../_utils.js";

export const handlePostEmotionAlternativeDetails = async (
  req: VercelRequest,
  res: VercelResponse,
) => {
  const user = await getUserFromAuthHeader(req.headers.authorization);
  const payload = await readJson<{
    note_id?: number;
    alternative?: string;
    created_at?: string;
    deviceId?: string;
  }>(req);

  const deviceId = normalizeDeviceId(payload.deviceId);
  if (!user && !deviceId) {
    return json(res, 401, { ok: false, message: "로그인이 필요합니다." });
  }

  const noteId = Number(payload.note_id ?? "");
  if (Number.isNaN(noteId)) {
    return json(res, 400, { ok: false, message: "note_id가 필요합니다." });
  }

  const alternative = String(payload.alternative ?? "").trim();
  if (!alternative) {
    return json(res, 400, { ok: false, message: "대안을 입력해주세요." });
  }

  const supabase = createSupabaseAdminClient();
  const insertPayload: {
    user_id?: string | null;
    device_id?: string | null;
    note_id: number;
    alternative: string;
    created_at?: string;
  } = {
    note_id: noteId,
    alternative,
  };

  if (user) {
    insertPayload.user_id = user.id;
  } else {
    insertPayload.user_id = null;
    insertPayload.device_id = deviceId;
  }

  if (payload.created_at) {
    insertPayload.created_at = payload.created_at;
  }

  const { error } = await supabase
    .from("emotion_alternative_details")
    .insert(insertPayload);

  if (error) {
    return json(res, 500, { ok: false, message: "대안 상세 저장에 실패했습니다." });
  }

  return json(res, 200, { ok: true });
};
