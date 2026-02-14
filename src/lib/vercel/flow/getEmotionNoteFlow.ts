import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createSupabaseAdminClient } from "../../supabase/adminNode.js";
import { json, getQueryParam } from "../_utils.js";
import { resolveIdentityFromQuery } from "../_identity.js";

// GET /api/emotion-flow?action=detail&flowId=...&includeMiddles=...
// flow 상세 조회
export const handleGetEmotionNoteFlow = async (
  req: VercelRequest,
  res: VercelResponse,
) => {
  const { user, deviceId } = await resolveIdentityFromQuery(req);
  if (!user && !deviceId) {
    return json(res, 401, { notes: [], middles: [] });
  }

  const flowIdParam = getQueryParam(req, "flowId");
  const includeMiddlesParam = getQueryParam(req, "includeMiddles");
  const flowId = Number(flowIdParam);
  const includeMiddles =
    includeMiddlesParam === null ||
    includeMiddlesParam === "" ||
    includeMiddlesParam === "1" ||
    includeMiddlesParam === "true";

  if (!flowIdParam || Number.isNaN(flowId)) {
    return json(res, 400, {
      notes: [],
      middles: [],
      message: "flowId가 필요합니다.",
    });
  }

  const supabase = createSupabaseAdminClient();
  const flowBaseQuery = supabase.from("emotion_flows").select("id");
  const flowQuery = user
    ? flowBaseQuery.eq("user_id", user.id)
    : flowBaseQuery.eq("device_id", deviceId).is("user_id", null);

  const { data: flow, error: flowError } = await flowQuery
    .eq("id", flowId)
    .maybeSingle();

  if (flowError) {
    return json(res, 500, {
      notes: [],
      middles: [],
      message: "플로우를 불러오지 못했습니다.",
    });
  }

  if (!flow) {
    return json(res, 200, { notes: [], middles: [] });
  }

  const { data: flowNotes, error: flowNotesError } = await supabase
    .from("emotion_flow_note_middles")
    .select("note_id")
    .eq("flow_id", flowId);

  if (flowNotesError) {
    return json(res, 500, {
      notes: [],
      middles: [],
      message: "플로우 노트를 불러오지 못했습니다.",
    });
  }

  const noteIds = (flowNotes ?? []).map((row) => row.note_id);
  const uniqueNoteIds = Array.from(new Set(noteIds));
  if (uniqueNoteIds.length === 0) {
    return json(res, 200, { notes: [], middles: [] });
  }

  const baseNotesQuery = supabase
    .from("emotion_notes")
    .select(
      `
      id,
      title,
      trigger_text,
      created_at,
      emotion_auto_thought_details(id,note_id,automatic_thought,emotion,created_at),
      emotion_error_details(id,note_id,error_label,error_description,created_at),
      emotion_alternative_details(id,note_id,alternative,created_at),
      emotion_behavior_details(
        id,
        note_id,
        behavior_label,
        behavior_description,
        error_tags,
        created_at
      )
    `,
    );

  const scopedNotesQuery = user
    ? baseNotesQuery.eq("user_id", user.id)
    : baseNotesQuery.eq("device_id", deviceId).is("user_id", null);

  const { data: notes, error: notesError } = await scopedNotesQuery
    .in("id", uniqueNoteIds)
    .order("created_at", { ascending: true });

  if (notesError) {
    return json(res, 500, {
      notes: [],
      middles: [],
      message: "노트를 불러오지 못했습니다.",
    });
  }

  let middles: {
    id: number;
    from_note_id: number;
    to_note_id: number;
    created_at: string;
  }[] = [];
  if (includeMiddles) {
    const { data: middleRows, error: middleError } = await supabase
      .from("emotion_note_middles")
      .select("id,from_note_id,to_note_id,created_at")
      .eq("flow_id", flowId)
      .order("created_at", { ascending: true });

    if (middleError) {
      return json(res, 500, {
        notes: notes ?? [],
        middles: [],
        message: "연결 정보를 불러오지 못했습니다.",
      });
    }

    middles = middleRows ?? [];
  }

  const mappedNotes =
    notes?.map((note) => {
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

      return {
        id: note.id,
        title: note.title,
        trigger_text: note.trigger_text,
        created_at: note.created_at,
        emotion_labels: emotionLabels,
        error_labels: errorLabels,
        behavior_labels: behaviorLabels,
        thought_details: note.emotion_auto_thought_details ?? [],
        error_details: note.emotion_error_details ?? [],
        alternative_details: note.emotion_alternative_details ?? [],
        behavior_details: note.emotion_behavior_details ?? [],
      };
    }) ?? [];

  const montageBaseQuery = supabase
    .from("emotion_montages")
    .select(
      "id,flow_id,main_note_id,sub_note_ids,montage_caption,montage_jsonb,atoms_jsonb,freeze_frames_jsonb,created_at",
    )
    .eq("flow_id", flowId)
    .order("created_at", { ascending: false });

  const montageQuery = user
    ? montageBaseQuery.eq("user_id", user.id)
    : montageBaseQuery.eq("device_id", deviceId).is("user_id", null);

  const { data: montages, error: montageError } = await montageQuery;

  if (montageError) {
    return json(res, 500, {
      notes: mappedNotes,
      middles,
      montages: [],
      message: "몽타주 정보를 불러오지 못했습니다.",
    });
  }

  return json(res, 200, { notes: mappedNotes, middles, montages: montages ?? [] });
};
