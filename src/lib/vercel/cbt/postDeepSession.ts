import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createSupabaseAdminClient } from "../../supabase/adminNode.js";
import { json, normalizeDeviceId } from "../_utils.js";
import { getUserFromAuthHeader } from "../../auth/sessionNode.js";

type DeepPayload = {
  deviceId?: string;
  title?: string;
  trigger_text?: string;
  emotion?: string;
  automatic_thought?: string;
  selected_cognitive_error?: { title?: string; detail?: string } | null;
  selected_alternative_thought?: string;
  main_id?: number;
  sub_ids?: number[];
  flow_id?: number | null;
};

// POST /api/deep-session
// deep-session 등록
export const handlePostDeepSession = async (
  req: VercelRequest,
  res: VercelResponse,
  payload: DeepPayload,
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
  const rawFlowId = payload.flow_id;
  const parsedFlowId =
    rawFlowId === null || rawFlowId === undefined ? null : Number(rawFlowId);

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
    if (rawFlowId === null || rawFlowId === undefined) {
      return json(res, 400, { ok: false, message: "flow_id가 필요합니다." });
    }

    const flowId =
      parsedFlowId !== null && Number.isFinite(parsedFlowId)
        ? parsedFlowId
        : null;

    if (flowId === null) {
      return json(res, 400, { ok: false, message: "flow_id가 올바르지 않습니다." });
    }

    const flowQuery = supabase.from("emotion_flows").select("id");
    const { data: flow, error: flowError } = user
      ? await flowQuery.eq("user_id", user.id).eq("id", flowId).maybeSingle()
      : await flowQuery
          .eq("device_id", deviceId)
          .is("user_id", null)
          .eq("id", flowId)
          .maybeSingle();

    if (flowError || !flow) {
      return json(res, 404, { ok: false, message: "플로우를 찾을 수 없습니다." });
    }

    const noteQuery = supabase.from("emotion_notes").select("id").in("id", uniqueIds);
    const { data: notes, error: noteError } = user
      ? await noteQuery.eq("user_id", user.id)
      : await noteQuery.eq("device_id", deviceId).is("user_id", null);

    if (noteError || !notes || notes.length !== uniqueIds.length) {
      return json(res, 400, { ok: false, message: "노트 정보를 확인할 수 없습니다." });
    }

    const { data: note, error: insertError } = await supabase
      .from("emotion_notes")
      .insert({
        ...owner,
        title,
        trigger_text: triggerText,
      })
      .select("id")
      .single();

    if (insertError || !note) {
      return json(res, 500, { ok: false, message: "노트를 저장하지 못했습니다." });
    }

    const noteId = note.id;
    const errorTitle = String(payload.selected_cognitive_error?.title ?? "").trim();
    const errorDetail = String(payload.selected_cognitive_error?.detail ?? "").trim();

    const middlePayload = uniqueIds.map((fromId) => ({
      flow_id: flowId,
      from_note_id: fromId,
      to_note_id: noteId,
    }));
    const flowNotePayload = uniqueIds
      .concat(noteId)
      .map((noteIdValue) => ({
        flow_id: flowId,
        note_id: noteIdValue,
      }));

    const detailInsert = supabase.from("emotion_note_details").insert({
      ...owner,
      note_id: noteId,
      automatic_thought: automaticThought,
      emotion,
    });
    const errorInsert = errorTitle
      ? supabase.from("emotion_error_details").insert({
          ...owner,
          note_id: noteId,
          error_label: errorTitle,
          error_description: errorDetail,
        })
      : Promise.resolve({ error: null });
    const alternativeInsert = supabase.from("emotion_alternative_details").insert({
      ...owner,
      note_id: noteId,
      alternative: alternativeThought,
    });
    const middleInsert =
      middlePayload.length > 0
        ? supabase
            .from("emotion_note_middles")
            .upsert(middlePayload, { onConflict: "flow_id,from_note_id,to_note_id" })
        : Promise.resolve({ error: null });
    const flowNoteInsert =
      flowNotePayload.length > 0
        ? supabase
            .from("emotion_flow_note_middles")
            .upsert(flowNotePayload, { onConflict: "flow_id,note_id" })
        : Promise.resolve({ error: null });

    const [
      detailResult,
      errorResult,
      alternativeResult,
      middleResult,
      flowNoteResult,
    ] =
      await Promise.all([
        detailInsert,
        errorInsert,
        alternativeInsert,
        middleInsert,
        flowNoteInsert,
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
    if (flowNoteResult.error) {
      return json(res, 500, { ok: false, message: "플로우 노트를 저장하지 못했습니다." });
    }

    return json(res, 200, { ok: true, noteId, flowId });
  } catch (error) {
    console.error("[/api/deep-session] error:", error);
    return json(res, 500, { ok: false, message: "세션 저장에 실패했습니다." });
  }
};
