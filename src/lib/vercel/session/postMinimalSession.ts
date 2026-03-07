import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createSupabaseAdminClient } from "../../supabase/adminNode.js";
import { json, normalizeDeviceId } from "../_utils.js";
import { getUserFromAuthHeader } from "../../auth/sessionNode.js";

type MinimalPayload = {
  deviceId?: string;
  title?: string;
  triggerText?: string;
  emotion?: string;
  emotions?: string[];
  emotionType?: "positive" | "negative";
  automaticThought?: string;
  alternativeThought?: string;
  cognitiveError?: { title?: string; detail?: string } | null;
  sdtType?: "autonomy" | "relatedness" | "competence" | null;
  sdtEmpathyText?: string;
  reflectionQuestion?: string;
  behaviorLabel?: string;
  behaviorDescription?: string;
  behaviorChecklist?: string[];
};

// POST /api/session
// session 등록
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
  const emotions = Array.isArray(payload.emotions)
    ? payload.emotions
        .map((value) => String(value ?? "").trim())
        .filter((value) => value.length > 0)
        .slice(0, 2)
    : [];
  const emotion = String(payload.emotion ?? "").trim();
  const normalizedEmotions =
    emotions.length > 0
      ? emotions
      : emotion
        ? [emotion]
        : [];
  const automaticThought = String(payload.automaticThought ?? "").trim();
  const alternativeThought = String(payload.alternativeThought ?? "").trim();
  const emotionType = payload.emotionType === "positive" ? "positive" : "negative";
  const errorTitle = String(payload.cognitiveError?.title ?? "").trim();
  const errorDescription = String(payload.cognitiveError?.detail ?? "").trim();
  const sdtType = payload.sdtType ?? null;
  const sdtEmpathyText = String(payload.sdtEmpathyText ?? "").trim();
  const reflectionQuestion = String(payload.reflectionQuestion ?? "").trim();
  const behaviorLabel = String(payload.behaviorLabel ?? "").trim();
  const behaviorDescription = String(payload.behaviorDescription ?? "").trim();
  const behaviorChecklist = Array.isArray(payload.behaviorChecklist)
    ? payload.behaviorChecklist
        .map((value) => String(value ?? "").trim())
        .filter((value) => value.length > 0)
        .slice(0, 3)
    : [];

  const hasPositivePayload =
    emotionType === "positive" &&
    !!sdtType &&
    !!sdtEmpathyText &&
    !!behaviorLabel &&
    !!behaviorDescription &&
    !!reflectionQuestion;

  const hasNegativePayload = emotionType === "negative" && !!alternativeThought;

  if (
    !title ||
    !triggerText ||
    normalizedEmotions.length === 0 ||
    !automaticThought ||
    (!hasPositivePayload && !hasNegativePayload)
  ) {
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
        emotion_type: emotionType,
        emotion_tags: normalizedEmotions,
        inner_belief: automaticThought,
        error_label: emotionType === "negative" ? errorTitle : "",
        error_description: emotionType === "negative" ? errorDescription : "",
        alternative: emotionType === "negative" ? alternativeThought : "",
        sdt_type: emotionType === "positive" ? sdtType : null,
        sdt_empathy_text: emotionType === "positive" ? sdtEmpathyText : "",
        reflection_question: emotionType === "positive" ? reflectionQuestion : "",
        is_history_represent: true,
      })
      .select("id")
      .single();

    if (noteError || !note) {
      throw new Error(noteError?.message || "note_create_failed");
    }

    const noteId = note.id;

    if (emotionType === "positive") {
      const { data: behaviorDetail, error: behaviorDetailError } = await supabase
        .from("emotion_behavior_details")
        .insert({
          ...owner,
          note_id: noteId,
          behavior_label: behaviorLabel,
          behavior_description: behaviorDescription,
          is_pinned: false,
        })
        .select("id")
        .single();

      if (behaviorDetailError || !behaviorDetail) {
        throw new Error(behaviorDetailError?.message || "behavior_detail_create_failed");
      }

      if (behaviorChecklist.length > 0) {
        const { error: checksError } = await supabase
          .from("emotion_behavior_checks")
          .insert(
            behaviorChecklist.map((checkLabel, index) => ({
              behavior_detail_id: behaviorDetail.id,
              check_label: checkLabel,
              sort_order: index,
              ...owner,
            })),
          );

        if (checksError) {
          throw new Error(checksError.message || "behavior_checks_create_failed");
        }
      }
    }

    return json(res, 200, { ok: true, noteId });
  } catch (error) {
    console.error("[/api/session] minimal error:", error);
    return json(res, 500, { ok: false, message: "기록 저장에 실패했습니다." });
  }
};
