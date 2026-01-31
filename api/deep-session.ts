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
    return json(res, 401, { ok: false, message: "로그인이 필요합니다." });
  }

  const payload = await readJson<{
    title?: string;
    trigger_text?: string;
    emotion?: string;
    automatic_thought?: string;
    selected_cognitive_error?: { title?: string; detail?: string } | null;
    selected_alternative_thought?: string;
    main_id?: number;
    sub_ids?: number[];
    group_id?: number | null;
  }>(req);

  const title = String(payload.title ?? "").trim();
  const triggerText = String(payload.trigger_text ?? "").trim();
  const emotion = String(payload.emotion ?? "").trim();
  const automaticThought = String(payload.automatic_thought ?? "").trim();
  const alternativeThought = String(payload.selected_alternative_thought ?? "").trim();
  const mainId = Number(payload.main_id ?? "");
  const subIds = Array.isArray(payload.sub_ids)
    ? payload.sub_ids
        .map((id) => Number(id))
        .filter((id) => Number.isFinite(id))
    : [];
  const rawGroupId = payload.group_id;
  const parsedGroupId =
    rawGroupId === null || rawGroupId === undefined ? null : Number(rawGroupId);

  if (!title || !triggerText || !emotion || !automaticThought || !alternativeThought) {
    return json(res, 400, { ok: false, message: "필수 입력값이 누락되었습니다." });
  }

  if (Number.isNaN(mainId)) {
    return json(res, 400, { ok: false, message: "main_id가 올바르지 않습니다." });
  }

  const uniqueIds = Array.from(new Set([mainId, ...subIds]));
  if (uniqueIds.length < 1 || uniqueIds.length > 3) {
    return json(res, 400, { ok: false, message: "선택된 노트 수가 올바르지 않습니다." });
  }

  try {
    const supabase = createSupabaseAdminClient();
    let groupId =
      parsedGroupId !== null && Number.isFinite(parsedGroupId)
        ? parsedGroupId
        : null;

    if (rawGroupId !== null && rawGroupId !== undefined && groupId === null) {
      return json(res, 400, { ok: false, message: "group_id가 올바르지 않습니다." });
    }

    if (!groupId) {
      const { data: group, error: groupError } = await supabase
        .from("emotion_note_groups")
        .insert({ user_id: user.id })
        .select("id")
        .single();

      if (groupError || !group) {
        return json(res, 500, { ok: false, message: "그룹 생성에 실패했습니다." });
      }

      groupId = group.id;

      const { error: updateError } = await supabase
        .from("emotion_notes")
        .update({ group_id: groupId })
        .in("id", uniqueIds)
        .eq("user_id", user.id);

      if (updateError) {
        return json(res, 500, { ok: false, message: "기존 노트를 갱신하지 못했습니다." });
      }
    } else {
      const { data: notes, error: noteError } = await supabase
        .from("emotion_notes")
        .select("id, group_id")
        .in("id", uniqueIds)
        .eq("user_id", user.id);

      if (noteError || !notes || notes.length !== uniqueIds.length) {
        return json(res, 400, { ok: false, message: "노트 정보를 확인할 수 없습니다." });
      }

      const mismatch = notes.some((note) => note.group_id !== groupId);
      if (mismatch) {
        return json(res, 400, { ok: false, message: "group_id가 노트와 일치하지 않습니다." });
      }
    }

    const { data: note, error: noteError } = await supabase
      .from("emotion_notes")
      .insert({
        user_id: user.id,
        title,
        trigger_text: triggerText,
        group_id: groupId,
      })
      .select("id")
      .single();

    if (noteError || !note) {
      return json(res, 500, { ok: false, message: "노트를 저장하지 못했습니다." });
    }

    const noteId = note.id;
    const errorTitle = String(payload.selected_cognitive_error?.title ?? "").trim();
    const errorDetail = String(payload.selected_cognitive_error?.detail ?? "").trim();

    const middlePayload = uniqueIds.map((fromId) => ({
      group_id: groupId,
      from_note_id: fromId,
      to_note_id: noteId,
    }));

    const detailInsert = supabase.from("emotion_note_details").insert({
      user_id: user.id,
      note_id: noteId,
      automatic_thought: automaticThought,
      emotion,
    });
    const errorInsert = errorTitle
      ? supabase.from("emotion_error_details").insert({
          user_id: user.id,
          note_id: noteId,
          error_label: errorTitle,
          error_description: errorDetail,
        })
      : Promise.resolve({ error: null });
    const alternativeInsert = supabase.from("emotion_alternative_details").insert({
      user_id: user.id,
      note_id: noteId,
      alternative: alternativeThought,
    });
    const middleInsert =
      middlePayload.length > 0
        ? supabase.from("emotion_note_middles").insert(middlePayload)
        : Promise.resolve({ error: null });

    const [detailResult, errorResult, alternativeResult, middleResult] =
      await Promise.all([
        detailInsert,
        errorInsert,
        alternativeInsert,
        middleInsert,
      ]);

    if (detailResult.error) {
      return json(res, 500, { ok: false, message: "상세 기록을 저장하지 못했습니다." });
    }
    if (errorResult.error) {
      return json(res, 500, { ok: false, message: "인지오류를 저장하지 못했습니다." });
    }
    if (alternativeResult.error) {
      return json(res, 500, { ok: false, message: "대안사고를 저장하지 못했습니다." });
    }
    if (middleResult.error) {
      return json(res, 500, { ok: false, message: "연결 정보를 저장하지 못했습니다." });
    }

    return json(res, 200, { ok: true, noteId, groupId });
  } catch (error) {
    console.error("[/api/deep-session] error:", error);
    return json(res, 500, { ok: false, message: "세션 저장에 실패했습니다." });
  }
}
