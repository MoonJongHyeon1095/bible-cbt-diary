import type { VercelRequest, VercelResponse } from "@vercel/node";
import type { EmotionNoteWithDetails } from "@/lib/types/emotionNoteTypes";
import { createSupabaseAdminClient } from "../../supabase/adminNode.js";
import { getQueryParam, json } from "../_utils.js";
import { resolveIdentityFromQuery } from "../_identity.js";

// GET /api/emotion-notes?action=detail&id=...
// emotion-notes 상세 조회
export const handleGetEmotionNote = async (
  req: VercelRequest,
  res: VercelResponse,
) => {
  const requestId = req.headers["x-request-id"];
  const { user, deviceId } = await resolveIdentityFromQuery(req);
  if (!user && !deviceId) {
    return json(res, 401, { note: null });
  }

  const idParam = getQueryParam(req, "id");
  const noteId = Number(idParam ?? "");
  if (Number.isNaN(noteId)) {
    return json(res, 400, { note: null, message: "id가 올바르지 않습니다." });
  }

  const supabase = createSupabaseAdminClient();
  const baseQuery = supabase
    .from("emotion_notes")
    .select(
      `
        id,
        title,
        trigger_text,
        created_at,
        emotion_type,
        emotion_tags,
        inner_belief,
        error_label,
        error_description,
        alternative,
        sdt_type,
        sdt_empathy_text,
        reflection_question,
        is_history_represent
      `,
    );

  const scopedQuery = user
    ? baseQuery.eq("user_id", user.id)
    : baseQuery.eq("device_id", deviceId).is("user_id", null);

  const { data, error } = await scopedQuery
    .eq("is_history_represent", true)
    .eq("id", noteId)
    .maybeSingle();

  if (error) {
    console.error("[emotion-notes] detail query failed", {
      requestId,
      userId: user?.id ?? null,
      noteId,
      error,
    });
    return json(res, 500, {
      note: null,
      message: "노트를 불러오지 못했습니다.",
    });
  }

  const note: EmotionNoteWithDetails | null = data
    ? {
        id: data.id,
        title: data.title,
        trigger_text: data.trigger_text,
        created_at: data.created_at,
        emotion_type: data.emotion_type ?? "negative",
        emotion_tags: data.emotion_tags ?? [],
        inner_belief: data.inner_belief ?? "",
        error_label: data.error_label ?? "",
        error_description: data.error_description ?? "",
        alternative: data.alternative ?? "",
        sdt_type: data.sdt_type ?? "",
        sdt_empathy_text: data.sdt_empathy_text ?? "",
        reflection_question: data.reflection_question ?? "",
        is_history_represent: data.is_history_represent ?? true,
        emotion_labels: data.emotion_tags ?? [],
        error_labels: data.error_label ? [data.error_label] : [],
        thought_details: data.inner_belief
          ? [
              {
                id: data.id,
                note_id: data.id,
                automatic_thought: data.inner_belief,
                emotion: (data.emotion_tags ?? []).join(", "),
                created_at: data.created_at,
              },
            ]
          : [],
        error_details: data.error_label || data.error_description
          ? [
              {
                id: data.id,
                note_id: data.id,
                error_label: data.error_label ?? "",
                error_description: data.error_description ?? "",
                created_at: data.created_at,
              },
            ]
          : [],
        alternative_details: data.alternative
          ? [
              {
                id: data.id,
                note_id: data.id,
                alternative: data.alternative,
                created_at: data.created_at,
              },
            ]
          : [],
        behavior_details: [],
      }
    : null;

  if (note?.emotion_type === "positive") {
    let behaviorRows: Array<{
      id: number;
      behavior_label: string;
      behavior_description: string;
      is_pinned: boolean;
      latest_tracked_on: string | null;
      created_at: string;
    }> | null = null;
    let behaviorError: unknown = null;

    if (data?.id) {
      // A note can have multiple linked behavior details over time, but only the oldest
      // linked one is the original session-generated suggestion. Later linked entries
      // belong to a different user flow and should not be mixed into note detail.
      const behaviorQuery = user
        ? supabase
            .from("emotion_behavior_details")
            .select(
              "id,behavior_label,behavior_description,is_pinned,latest_tracked_on,created_at",
            )
            .eq("user_id", user.id)
            .eq("note_id", data.id)
        : supabase
            .from("emotion_behavior_details")
            .select(
              "id,behavior_label,behavior_description,is_pinned,latest_tracked_on,created_at",
            )
            .eq("device_id", deviceId)
            .is("user_id", null)
            .eq("note_id", data.id);

      const result = await behaviorQuery
        .order("created_at", { ascending: true })
        .limit(1);
      behaviorRows = result.data;
      behaviorError = result.error;
    }

    if (!behaviorError && behaviorRows && behaviorRows.length > 0) {
      note.behavior_details = behaviorRows.map((row) => ({
        id: row.id,
        behavior_label: row.behavior_label,
        behavior_description: row.behavior_description,
        is_pinned: row.is_pinned,
        latest_tracked_on: row.latest_tracked_on,
        created_at: row.created_at,
      }));
    }
  }

  return json(res, 200, { note });
};
