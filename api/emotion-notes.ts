import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createSupabaseAdminClient } from "../src/lib/supabase/admin";
import { getUserFromAuthHeader } from "../src/lib/auth/session";
import { getKstDayRange } from "../src/lib/utils/time";
import { getQueryParam, json, methodNotAllowed, readJson, handleCors } from "./_utils";

const getDateRange = (dateParam?: string | null) => {
  return getKstDayRange(dateParam ?? new Date());
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  const user = await getUserFromAuthHeader(req.headers.authorization);

  if (!user) {
    if (req.method === "GET") {
      return json(res, 401, { notes: [] });
    }
    return json(res, 401, { ok: false, message: "로그인이 필요합니다." });
  }

  if (req.method === "GET") {
    const idParam = getQueryParam(req, "id");

    if (idParam) {
      const noteId = Number(idParam);
      if (Number.isNaN(noteId)) {
        return json(res, 400, { note: null, message: "id가 올바르지 않습니다." });
      }

      const supabase = createSupabaseAdminClient();
      const { data, error } = await supabase
        .from("emotion_notes")
        .select(
          `
        id,
        title,
        trigger_text,
        group_id,
        created_at,
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
        .eq("id", noteId)
        .order("created_at", {
          ascending: true,
          foreignTable: "emotion_note_details",
        })
        .order("created_at", {
          ascending: true,
          foreignTable: "emotion_error_details",
        })
        .order("created_at", {
          ascending: true,
          foreignTable: "emotion_alternative_details",
        })
        .order("created_at", {
          ascending: true,
          foreignTable: "emotion_behavior_details",
        })
        .maybeSingle();

      if (error) {
        return json(res, 500, {
          note: null,
          message: "노트를 불러오지 못했습니다.",
        });
      }

      const note = data
        ? {
            id: data.id,
            title: data.title,
            trigger_text: data.trigger_text,
            group_id: data.group_id ?? null,
            created_at: data.created_at,
            thought_details: data.emotion_note_details ?? [],
            error_details: data.emotion_error_details ?? [],
            alternative_details: data.emotion_alternative_details ?? [],
            behavior_details: data.emotion_behavior_details ?? [],
          }
        : null;

      return json(res, 200, { note });
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
    const { data, error } = await supabase
      .from("emotion_notes")
      .select(
        `
      id,
      title,
      trigger_text,
      group_id,
      created_at,
      emotion_note_details(emotion),
      emotion_error_details(error_label),
      emotion_behavior_details(behavior_label)
    `,
      )
      .eq("user_id", user.id)
      .gte("created_at", startIso)
      .lt("created_at", endIso)
      .order("created_at", { ascending: false });

    if (error) {
      return json(res, 500, {
        notes: [],
        message: "노트를 불러오지 못했습니다.",
      });
    }

    const notes =
      data?.map((note) => {
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
          group_id: note.group_id ?? null,
          created_at: note.created_at,
          emotion_labels: emotionLabels,
          error_labels: errorLabels,
          behavior_labels: behaviorLabels,
        };
      }) ?? [];

    return json(res, 200, { notes });
  }

  if (req.method === "POST") {
    const payload = await readJson<{
      title?: string;
      trigger_text?: string;
      created_at?: string;
    }>(req);

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
      user_id: string;
      title: string;
      trigger_text: string;
      created_at?: string;
    } = {
      user_id: user.id,
      title,
      trigger_text: triggerText,
    };

    if (payload.created_at) {
      insertPayload.created_at = payload.created_at;
    }

    const { data, error } = await supabase
      .from("emotion_notes")
      .insert(insertPayload)
      .select("id")
      .single();

    if (error) {
      return json(res, 500, { ok: false, message: "기록 저장에 실패했습니다." });
    }

    return json(res, 200, {
      ok: true,
      message: "기록이 저장되었습니다.",
      noteId: data?.id ?? null,
    });
  }

  if (req.method === "PATCH") {
    const payload = await readJson<{
      id?: number;
      title?: string;
      trigger_text?: string;
    }>(req);

    const noteId = Number(payload.id ?? "");
    if (Number.isNaN(noteId)) {
      return json(res, 400, { ok: false, message: "id가 필요합니다." });
    }

    const updatePayload: {
      title?: string;
      trigger_text?: string;
      updated_at?: string;
    } = {
      updated_at: new Date().toISOString(),
    };

    if (payload.title !== undefined) {
      updatePayload.title = String(payload.title).trim();
    }
    if (payload.trigger_text !== undefined) {
      updatePayload.trigger_text = String(payload.trigger_text).trim();
    }

    const supabase = createSupabaseAdminClient();
    const { error } = await supabase
      .from("emotion_notes")
      .update(updatePayload)
      .eq("id", noteId)
      .eq("user_id", user.id);

    if (error) {
      return json(res, 500, { ok: false, message: "기록 수정에 실패했습니다." });
    }

    return json(res, 200, { ok: true });
  }

  if (req.method === "DELETE") {
    const payload = await readJson<{ id?: number }>(req);
    const noteId = Number(payload.id ?? "");
    if (Number.isNaN(noteId)) {
      return json(res, 400, { ok: false, message: "id가 필요합니다." });
    }

    const supabase = createSupabaseAdminClient();
    const { error } = await supabase
      .from("emotion_notes")
      .delete()
      .eq("id", noteId)
      .eq("user_id", user.id);

    if (error) {
      return json(res, 500, { ok: false, message: "기록 삭제에 실패했습니다." });
    }

    return json(res, 200, { ok: true });
  }

  return methodNotAllowed(res);
}
