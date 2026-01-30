import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createSupabaseAdminClient } from "../src/lib/supabase/admin";
import { getUserFromAuthHeader } from "../src/lib/auth/session";
import { getQueryParam, json, methodNotAllowed, handleCors } from "./_utils";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  if (req.method !== "GET") {
    return methodNotAllowed(res);
  }

  const user = await getUserFromAuthHeader(req.headers.authorization);

  if (!user) {
    return json(res, 401, { notes: [], middles: [] });
  }

  const action = getQueryParam(req, "action");
  const groupIdParam = getQueryParam(req, "groupId");
  const groupId = Number(groupIdParam);

  const supabase = createSupabaseAdminClient();

  if (action === "groups") {
    const { data: groups, error } = await supabase
      .from("emotion_note_groups")
      .select("id, created_at, emotion_notes(count)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return json(res, 500, {
        groups: [],
        message: "그룹 정보를 불러오지 못했습니다.",
      });
    }

    const mappedGroups =
      groups?.map((group) => ({
        id: group.id,
        created_at: group.created_at,
        note_count: group.emotion_notes?.[0]?.count ?? 0,
      })) ?? [];

    return json(res, 200, { groups: mappedGroups });
  }

  if (!groupIdParam || Number.isNaN(groupId)) {
    return json(res, 400, {
      notes: [],
      middles: [],
      message: "groupId가 필요합니다.",
    });
  }

  const { data: notes, error: notesError } = await supabase
    .from("emotion_notes")
    .select(
      `
      id,
      title,
      trigger_text,
      created_at,
      group_id,
      emotion_note_details(id,note_id,automatic_thought,emotion,created_at),
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
    )
    .eq("user_id", user.id)
    .eq("group_id", groupId)
    .order("created_at", { ascending: true });

  if (notesError) {
    return json(res, 500, {
      notes: [],
      middles: [],
      message: "노트를 불러오지 못했습니다.",
    });
  }

  const { data: middles, error: middleError } = await supabase
    .from("emotion_note_middles")
    .select("id,from_note_id,to_note_id,created_at")
    .eq("group_id", groupId)
    .order("created_at", { ascending: true });

  if (middleError) {
    return json(res, 500, {
      notes: notes ?? [],
      middles: [],
      message: "연결 정보를 불러오지 못했습니다.",
    });
  }

  const mappedNotes =
    notes?.map((note) => {
      const emotionLabels = Array.from(
        new Set(
          (note.emotion_note_details ?? [])
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
        group_id: note.group_id ?? null,
        emotion_labels: emotionLabels,
        error_labels: errorLabels,
        behavior_labels: behaviorLabels,
        thought_details: note.emotion_note_details ?? [],
        error_details: note.emotion_error_details ?? [],
        alternative_details: note.emotion_alternative_details ?? [],
        behavior_details: note.emotion_behavior_details ?? [],
      };
    }) ?? [];

  return json(res, 200, { notes: mappedNotes, middles: middles ?? [] });
}
