import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createSupabaseAdminClient } from "../../supabase/adminNode.js";
import { getKstDayRange } from "../../utils/time.js";
import { resolveIdentityFromQuery } from "../_identity.js";
import { getQueryParam, json } from "../_utils.js";

const getDateRange = (dateParam?: string | null) => {
  return getKstDayRange(dateParam ?? new Date());
};

// GET /api/emotion-notes?action=list&start=...&end=...
// emotion-notes 목록 조회 (today, month)
export const handleGetEmotionNoteList = async (
  req: VercelRequest,
  res: VercelResponse,
) => {
  const requestId = req.headers["x-request-id"];
  const { user, deviceId } = await resolveIdentityFromQuery(req);
  if (!user && !deviceId) {
    return json(res, 401, { notes: [] });
  }

  const startParam = getQueryParam(req, "start");
  const endParam = getQueryParam(req, "end");
  const { startIso, endIso } =
    startParam && endParam
      ? {
          startIso: new Date(startParam).toISOString(),
          endIso: new Date(endParam).toISOString(),
        }
      : getDateRange(getQueryParam(req, "date"));

  const supabase = createSupabaseAdminClient();
  const baseQuery = supabase.from("emotion_notes").select(
    `
      id,
      title,
      trigger_text,
      created_at,
      emotion_flow_note_middles(flow_id),
      emotion_auto_thought_details(emotion),
      emotion_error_details(error_label),
      emotion_behavior_details(behavior_label)
    `,
  );

  const scopedQuery = user
    ? baseQuery.eq("user_id", user.id)
    : baseQuery.eq("device_id", deviceId).is("user_id", null);

  const { data, error } = await scopedQuery
    .gte("created_at", startIso)
    .lt("created_at", endIso)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[emotion-notes] list query failed", {
      requestId,
      userId: user?.id ?? null,
      startIso,
      endIso,
      error,
    });
    return json(res, 500, {
      notes: [],
      message: "노트를 불러오지 못했습니다.",
    });
  }

  const notes =
    data?.map((note) => {
      const emotionLabels = Array.from(
        new Set(
          (note.emotion_auto_thought_details ?? [])
            .map((detail) => detail.emotion)
            .filter(Boolean),
        ),
      );
      const errorLabels = Array.from(
        new Set(
          (note.emotion_error_details ?? [])
            .map((detail) => detail.error_label)
            .filter(Boolean),
        ),
      );
      const behaviorLabels = Array.from(
        new Set(
          (note.emotion_behavior_details ?? [])
            .map((detail) => detail.behavior_label)
            .filter(Boolean),
        ),
      );
      const flowIds = Array.from(
        new Set(
          (note.emotion_flow_note_middles ?? [])
            .map((detail) => Number(detail.flow_id))
            .filter((id) => Number.isFinite(id)),
        ),
      );

      return {
        id: note.id,
        title: note.title,
        trigger_text: note.trigger_text,
        created_at: note.created_at,
        emotion_labels: emotionLabels,
        error_labels: errorLabels,
        behavior_labels: behaviorLabels,
        flow_ids: flowIds,
      };
    }) ?? [];

  return json(res, 200, { notes });
};
