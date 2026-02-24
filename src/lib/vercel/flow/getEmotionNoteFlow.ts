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
    return json(res, 401, { flow: null, notes: [], middles: [], montages: [] });
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
      flow: null,
      notes: [],
      middles: [],
      montages: [],
      message: "flowId가 필요합니다.",
    });
  }

  const supabase = createSupabaseAdminClient();
  const flowBaseQuery = supabase
    .from("emotion_flows")
    .select("id,title,description");
  const flowQuery = user
    ? flowBaseQuery.eq("user_id", user.id)
    : flowBaseQuery.eq("device_id", deviceId).is("user_id", null);

  const { data: flow, error: flowError } = await flowQuery
    .eq("id", flowId)
    .maybeSingle();

  if (flowError) {
    return json(res, 500, {
      flow: null,
      notes: [],
      middles: [],
      montages: [],
      message: "플로우를 불러오지 못했습니다.",
    });
  }

  if (!flow) {
    return json(res, 200, { flow: null, notes: [], middles: [], montages: [] });
  }

  const flowMeta = {
    id: flow.id,
    title: flow.title ?? "",
    description: flow.description ?? null,
  };

  const middlesPromise = includeMiddles
    ? supabase
        .from("emotion_note_middles")
        .select("id,from_note_id,to_note_id,created_at")
        .eq("flow_id", flowId)
        .order("created_at", { ascending: true })
    : Promise.resolve({ data: [], error: null });

  const montageBaseQuery = supabase
    .from("emotion_montages")
    .select(
      "id,flow_id,main_note_id,sub_note_ids,montage_caption,montage_jsonb,atoms_jsonb,freeze_frames_jsonb,created_at",
    )
    .eq("flow_id", flowId)
    .order("created_at", { ascending: false });

  const montagePromise = user
    ? montageBaseQuery.eq("user_id", user.id)
    : montageBaseQuery.eq("device_id", deviceId).is("user_id", null);

  const { data: flowNotes, error: flowNotesError } = await supabase
    .from("emotion_flow_note_middles")
    .select("note_id")
    .eq("flow_id", flowId);

  if (flowNotesError) {
    return json(res, 500, {
      flow: flowMeta,
      notes: [],
      middles: [],
      montages: [],
      message: "플로우 노트를 불러오지 못했습니다.",
    });
  }

  const noteIds = (flowNotes ?? []).map((row) => row.note_id);
  const uniqueNoteIds = Array.from(new Set(noteIds));

  let mappedNotes:
    | {
        id: number;
        title: string;
        trigger_text: string;
        created_at: string;
        emotion_tags: string[];
        inner_belief: string;
        error_label: string;
        error_description: string;
        alternative: string;
        emotion_labels: string[];
        error_labels: string[];
        behavior_labels: string[];
        thought_details: unknown[];
        error_details: unknown[];
        alternative_details: unknown[];
        behavior_details: unknown[];
      }[]
    | [] = [];

  if (uniqueNoteIds.length > 0) {
    const baseNotesQuery = supabase
      .from("emotion_notes")
      .select(
        `
        id,
        title,
        trigger_text,
        created_at,
        emotion_tags,
        inner_belief,
        error_label,
        error_description,
        alternative
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
        flow: flowMeta,
        notes: [],
        middles: [],
        montages: [],
        message: "노트를 불러오지 못했습니다.",
      });
    }

    mappedNotes =
      notes?.map((note) => {
        const rawEmotionTags = Array.isArray(note.emotion_tags)
          ? note.emotion_tags
          : [];
        const emotionLabels = Array.from(
          new Set(
            rawEmotionTags.filter(
              (value: unknown): value is string =>
                typeof value === "string" && value.length > 0,
            ),
          ),
        );
        const errorLabels = note.error_label ? [note.error_label] : [];
        const behaviorLabels: string[] = [];

        return {
          id: note.id,
          title: note.title,
          trigger_text: note.trigger_text,
          created_at: note.created_at,
          emotion_tags: note.emotion_tags ?? [],
          inner_belief: note.inner_belief ?? "",
          error_label: note.error_label ?? "",
          error_description: note.error_description ?? "",
          alternative: note.alternative ?? "",
          emotion_labels: emotionLabels,
          error_labels: errorLabels,
          behavior_labels: behaviorLabels,
          thought_details: note.inner_belief
            ? [
                {
                  id: note.id,
                  note_id: note.id,
                  automatic_thought: note.inner_belief,
                  emotion: (note.emotion_tags ?? []).join(", "),
                  created_at: note.created_at,
                },
              ]
            : [],
          error_details: note.error_label || note.error_description
            ? [
                {
                  id: note.id,
                  note_id: note.id,
                  error_label: note.error_label ?? "",
                  error_description: note.error_description ?? "",
                  created_at: note.created_at,
                },
              ]
            : [],
          alternative_details: note.alternative
            ? [
                {
                  id: note.id,
                  note_id: note.id,
                  alternative: note.alternative,
                  created_at: note.created_at,
                },
              ]
            : [],
          behavior_details: [],
        };
      }) ?? [];
  }

  const [{ data: middleRows, error: middleError }, { data: montages, error: montageError }] =
    await Promise.all([middlesPromise, montagePromise]);

  if (middleError) {
    return json(res, 500, {
      flow: flowMeta,
      notes: mappedNotes,
      middles: [],
      montages: [],
      message: "연결 정보를 불러오지 못했습니다.",
    });
  }

  if (montageError) {
    return json(res, 500, {
      flow: flowMeta,
      notes: mappedNotes,
      middles: middleRows ?? [],
      montages: [],
      message: "몽타주 정보를 불러오지 못했습니다.",
    });
  }

  return json(res, 200, {
    flow: flowMeta,
    notes: mappedNotes,
    middles: middleRows ?? [],
    montages: montages ?? [],
  });
};
