import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createSupabaseAdminClient } from "../../supabase/adminNode.js";
import { getUserFromAuthHeader } from "../../auth/sessionNode.js";
import { json, readJson, normalizeDeviceId } from "../_utils.js";

export const handlePostEmotionErrorDetails = async (
  req: VercelRequest,
  res: VercelResponse,
) => {
  const user = await getUserFromAuthHeader(req.headers.authorization);
  const payload = await readJson<{
    note_id?: number;
    error_label?: string;
    error_description?: string;
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

  const errorLabel = String(payload.error_label ?? "").trim();
  const errorDescription = String(payload.error_description ?? "").trim();

  if (!errorLabel || !errorDescription) {
    return json(res, 400, { ok: false, message: "에러 라벨과 설명을 입력해주세요." });
  }

  const supabase = createSupabaseAdminClient();
  const insertPayload: {
    user_id?: string | null;
    device_id?: string | null;
    note_id: number;
    error_label: string;
    error_description: string;
    created_at?: string;
  } = {
    note_id: noteId,
    error_label: errorLabel,
    error_description: errorDescription,
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
    .from("emotion_error_details")
    .insert(insertPayload);

  if (error) {
    return json(res, 500, { ok: false, message: "에러 상세 저장에 실패했습니다." });
  }

  return json(res, 200, { ok: true });
};
