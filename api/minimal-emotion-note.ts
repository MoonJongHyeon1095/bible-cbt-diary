import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createSupabaseAdminClient } from "../src/lib/supabase/adminNode.js";
import { getUserFromAuthHeader } from "../src/lib/auth/sessionNode.js";
import { json, methodNotAllowed, readJson, handleCors } from "./_utils.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  if (req.method !== "POST") {
    return methodNotAllowed(res);
  }

  const user = await getUserFromAuthHeader(req.headers.authorization);

  if (!user) {
    return json(res, 401, { ok: false, message: "Unauthorized" });
  }

  const payload = await readJson<{
    title?: string;
    triggerText?: string;
    emotion?: string;
    automaticThought?: string;
    alternativeThought?: string;
    cognitiveError?: { title?: string; detail?: string } | null;
  }>(req);

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
        user_id: user.id,
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
        user_id: user.id,
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
          user_id: user.id,
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
        user_id: user.id,
        note_id: noteId,
        alternative: alternativeThought,
      });

    if (alternativeError) {
      throw new Error(alternativeError.message || "alternative_create_failed");
    }

    return json(res, 200, { ok: true, noteId });
  } catch (error) {
    console.error("[/api/minimal-emotion-note] error:", error);
    return json(res, 500, { ok: false, message: "기록 저장에 실패했습니다." });
  }
}
