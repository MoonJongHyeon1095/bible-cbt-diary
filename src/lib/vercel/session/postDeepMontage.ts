import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createSupabaseAdminClient } from "../../supabase/adminNode.js";
import { json, normalizeDeviceId } from "../_utils.js";
import { getUserFromAuthHeader } from "../../auth/sessionNode.js";

type MontagePayload = {
  deviceId?: string;
  flow_id?: number | null;
  main_note_id?: number;
  sub_note_ids?: number[];
  atoms_jsonb?: unknown;
  montage_caption?: string;
  montage_jsonb?: unknown;
  freeze_frames_jsonb?: unknown;
};

// POST /api/session
// montage 저장
export const handlePostDeepMontage = async (
  req: VercelRequest,
  res: VercelResponse,
  payload: MontagePayload,
) => {
  const user = await getUserFromAuthHeader(req.headers.authorization);
  const deviceId = normalizeDeviceId(payload.deviceId);

  if (!user && !deviceId) {
    return json(res, 401, { ok: false, message: "로그인이 필요합니다." });
  }

  const owner = user
    ? { user_id: user.id, device_id: null }
    : { user_id: null, device_id: deviceId };

  const rawFlowId = payload.flow_id;
  const parsedFlowId =
    rawFlowId === null || rawFlowId === undefined ? null : Number(rawFlowId);

  if (parsedFlowId === null || Number.isNaN(parsedFlowId)) {
    return json(res, 400, { ok: false, message: "flow_id가 올바르지 않습니다." });
  }

  const mainNoteId = Number(payload.main_note_id ?? "");
  if (Number.isNaN(mainNoteId)) {
    return json(res, 400, { ok: false, message: "main_note_id가 올바르지 않습니다." });
  }

  const subNoteIds = Array.isArray(payload.sub_note_ids)
    ? payload.sub_note_ids
        .map((id) => Number(id))
        .filter((id) => Number.isFinite(id))
    : [];

  const atomsJsonb = Array.isArray(payload.atoms_jsonb)
    ? payload.atoms_jsonb
    : null;
  const freezeFramesJsonb = Array.isArray(payload.freeze_frames_jsonb)
    ? payload.freeze_frames_jsonb
    : null;
  const montageJsonb =
    payload.montage_jsonb &&
    typeof payload.montage_jsonb === "object" &&
    !Array.isArray(payload.montage_jsonb)
      ? payload.montage_jsonb
      : null;
  const montageCaption = String(payload.montage_caption ?? "").trim();

  if (!atomsJsonb || !freezeFramesJsonb || !montageJsonb) {
    return json(res, 400, { ok: false, message: "montage 데이터가 올바르지 않습니다." });
  }

  const uniqueIds = Array.from(new Set([mainNoteId, ...subNoteIds]));

  try {
    const supabase = createSupabaseAdminClient();

    const flowQuery = supabase.from("emotion_flows").select("id");
    const { data: flow, error: flowError } = user
      ? await flowQuery.eq("user_id", user.id).eq("id", parsedFlowId).maybeSingle()
      : await flowQuery
          .eq("device_id", deviceId)
          .is("user_id", null)
          .eq("id", parsedFlowId)
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

    const { data: montage, error: montageError } = await supabase
      .from("emotion_montages")
      .insert({
        ...owner,
        flow_id: parsedFlowId,
        main_note_id: mainNoteId,
        sub_note_ids: subNoteIds,
        atoms_jsonb: atomsJsonb,
        montage_caption: montageCaption,
        montage_jsonb: montageJsonb,
        freeze_frames_jsonb: freezeFramesJsonb,
      })
      .select("id")
      .single();

    if (montageError || !montage) {
      return json(res, 500, { ok: false, message: "montage 저장에 실패했습니다." });
    }

    return json(res, 200, { ok: true, montageId: montage.id });
  } catch (error) {
    console.error("[/api/session] montage error:", error);
    return json(res, 500, { ok: false, message: "montage 저장에 실패했습니다." });
  }
};
