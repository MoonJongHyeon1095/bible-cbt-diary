import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createSupabaseAdminClient } from "../../supabase/adminNode.js";
import { getUserFromAuthHeader } from "../../auth/sessionNode.js";
import { json, readJson, normalizeDeviceId } from "../_utils.js";

export const handlePostSessionHistory = async (
  req: VercelRequest,
  res: VercelResponse,
) => {
  const user = await getUserFromAuthHeader(req.headers.authorization);
  const payload = await readJson<{
    timestamp?: string;
    user_input?: string;
    emotion_thought_pairs?: unknown;
    selected_cognitive_errors?: unknown;
    selected_alternative_thought?: string | null;
    selected_behavior?: unknown;
    bible_verse?: unknown;
    deviceId?: string;
  }>(req);

  const deviceId = normalizeDeviceId(payload.deviceId);
  if (!user && !deviceId) {
    return json(res, 401, { ok: false, message: "로그인이 필요합니다." });
  }

  const timestamp = String(payload.timestamp ?? "").trim();
  const userInput = String(payload.user_input ?? "").trim();

  if (!timestamp || !userInput) {
    return json(res, 400, { ok: false, message: "필수 입력값이 누락되었습니다." });
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("session_history").insert({
      user_id: user?.id ?? null,
      device_id: user ? null : deviceId,
      timestamp,
      user_input: userInput,
      emotion_thought_pairs: payload.emotion_thought_pairs ?? [],
      selected_cognitive_errors: payload.selected_cognitive_errors ?? [],
      selected_alternative_thought: payload.selected_alternative_thought ?? "",
      selected_behavior: payload.selected_behavior ?? null,
      bible_verse: payload.bible_verse ?? null,
    });

    if (error) {
      return json(res, 500, { ok: false, message: "세션 저장에 실패했습니다." });
    }

    return json(res, 200, { ok: true });
  } catch (error) {
    console.error("[/api/session-history] error:", error);
    return json(res, 500, { ok: false, message: "세션 저장에 실패했습니다." });
  }
};
