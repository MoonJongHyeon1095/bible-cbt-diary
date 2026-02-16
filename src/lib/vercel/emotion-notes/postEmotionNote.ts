import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createSupabaseAdminClient } from "../../supabase/adminNode.js";
import { getUserFromAuthHeader } from "../../auth/sessionNode.js";
import { json, readJson, normalizeDeviceId } from "../_utils.js";

// POST /api/emotion-notes
// emotion-notes 등록
export const handlePostEmotionNote = async (
  req: VercelRequest,
  res: VercelResponse,
) => {
  const requestId = req.headers["x-request-id"];
  const user = await getUserFromAuthHeader(req.headers.authorization);
  const payload = await readJson<{
    title?: string;
    trigger_text?: string;
    emotion_tags?: string[];
    inner_belief?: string;
    error_label?: string;
    error_description?: string;
    alternative?: string;
    created_at?: string;
    deviceId?: string;
  }>(req);

  const deviceId = normalizeDeviceId(payload.deviceId);
  if (!user && !deviceId) {
    return json(res, 401, { ok: false, message: "로그인이 필요합니다." });
  }

  const title = String(payload.title ?? "").trim();
  const triggerText = String(payload.trigger_text ?? "").trim();

  if (!title || !triggerText) {
    return json(res, 400, {
      ok: false,
      message: "제목과 트리거를 입력해주세요.",
    });
  }

  const supabase = createSupabaseAdminClient();
  const insertPayload: {
    user_id?: string | null;
    device_id?: string | null;
    title: string;
    trigger_text: string;
    emotion_tags?: string[];
    inner_belief?: string;
    error_label?: string;
    error_description?: string;
    alternative?: string;
    created_at?: string;
  } = {
    title,
    trigger_text: triggerText,
    emotion_tags: Array.isArray(payload.emotion_tags)
      ? payload.emotion_tags
          .map((value) => String(value).trim())
          .filter((value) => value.length > 0)
      : [],
    inner_belief: String(payload.inner_belief ?? "").trim(),
    error_label: String(payload.error_label ?? "").trim(),
    error_description: String(payload.error_description ?? "").trim(),
    alternative: String(payload.alternative ?? "").trim(),
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

  const { data, error } = await supabase
    .from("emotion_notes")
    .insert(insertPayload)
    .select("id")
    .single();

  if (error) {
    console.error("[emotion-notes] insert failed", {
      requestId,
      userId: user?.id ?? null,
      error,
    });
    return json(res, 500, { ok: false, message: "기록 저장에 실패했습니다." });
  }

  return json(res, 200, {
    ok: true,
    message: "기록이 저장되었습니다.",
    noteId: data?.id ?? null,
  });
};
