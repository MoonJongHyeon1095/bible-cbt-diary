import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createSupabaseAdminClient } from "../../supabase/adminNode.js";
import { json, normalizeDeviceId } from "../_utils.js";
import { getUserFromAuthHeader } from "../../auth/sessionNode.js";

type MinimalPayload = {
  deviceId?: string;
  title?: string;
  triggerText?: string;
  emotion?: string;
  automaticThought?: string;
  alternativeThought?: string;
  cognitiveError?: { title?: string; detail?: string } | null;
};

// POST /api/deep-session
// deep-session 등록
export const handlePostMinimalSession = async (
  req: VercelRequest,
  res: VercelResponse,
  payload: MinimalPayload,
) => {
  const user = await getUserFromAuthHeader(req.headers.authorization);
  const deviceId = normalizeDeviceId(payload.deviceId);

  if (!user && !deviceId) {
    return json(res, 401, { ok: false, message: "로그인이 필요합니다." });
  }

  const owner = user
    ? { user_id: user.id, device_id: null }
    : { user_id: null, device_id: deviceId };

  const title = String(payload.title ?? "").trim();
  const triggerText = String(payload.triggerText ?? "").trim();
  const emotion = String(payload.emotion ?? "").trim();
  const automaticThought = String(payload.automaticThought ?? "").trim();
  const alternativeThought = String(payload.alternativeThought ?? "").trim();
  const errorTitle = String(payload.cognitiveError?.title ?? "").trim();
  const errorDescription = String(payload.cognitiveError?.detail ?? "").trim();

  if (!title || !triggerText || !emotion || !automaticThought || !alternativeThought) {
    return json(res, 400, { ok: false, message: "필수 입력값이 누락되었습니다." });
  }

  try {
    const supabase = createSupabaseAdminClient();

    const { data: note, error: noteError } = await supabase
      .from("emotion_notes")
      .insert({
        ...owner,
        title,
        trigger_text: triggerText,
      })
      .select("id")
      .single();

    if (noteError || !note) {
      throw new Error(noteError?.message || "note_create_failed");
    }

    const noteId = note.id;

    const { error: detailError } = await supabase
      .from("emotion_note_details")
      .insert({
        ...owner,
        note_id: noteId,
        automatic_thought: automaticThought,
        emotion,
      });

    if (detailError) {
      throw new Error(detailError.message || "detail_create_failed");
    }

    if (errorTitle) {
      const { error: errorDetail } = await supabase
        .from("emotion_error_details")
        .insert({
          ...owner,
          note_id: noteId,
          error_label: errorTitle,
          error_description: errorDescription,
        });
      if (errorDetail) {
        throw new Error(errorDetail.message || "error_create_failed");
      }
    }

    const { error: alternativeError } = await supabase
      .from("emotion_alternative_details")
      .insert({
        ...owner,
        note_id: noteId,
        alternative: alternativeThought,
      });

    if (alternativeError) {
      throw new Error(alternativeError.message || "alternative_create_failed");
    }

    return json(res, 200, { ok: true, noteId });
  } catch (error) {
    console.error("[/api/deep-session] minimal error:", error);
    return json(res, 500, { ok: false, message: "기록 저장에 실패했습니다." });
  }
};
