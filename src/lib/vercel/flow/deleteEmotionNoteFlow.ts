import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createSupabaseAdminClient } from "../../supabase/adminNode.js";
import { getUserFromAuthHeader } from "../../auth/sessionNode.js";
import { json, normalizeDeviceId, readJson, getQueryParam } from "../_utils.js";

type DeleteFlowPayload = {
  flow_id?: number;
  note_id?: number;
  deviceId?: string;
};

const fetchFlow = async (
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  flowId: number,
  owner: { user_id: string | null; device_id: string | null },
) => {
  const flowQuery = supabase.from("emotion_flows").select("id").eq("id", flowId);
  const { data: flow, error: flowError } = owner.user_id
    ? await flowQuery.eq("user_id", owner.user_id).maybeSingle()
    : await flowQuery.eq("device_id", owner.device_id).is("user_id", null).maybeSingle();

  return { flow, flowError };
};

const handleDeleteFlowNote = async (
  res: VercelResponse,
  payload: DeleteFlowPayload,
  owner: { user_id: string | null; device_id: string | null },
) => {
  const flowId = Number(payload.flow_id ?? "");
  const noteId = Number(payload.note_id ?? "");

  if (Number.isNaN(flowId) || Number.isNaN(noteId)) {
    return json(res, 400, {
      ok: false,
      message: "flow_id 또는 note_id가 필요합니다.",
    });
  }

  const supabase = createSupabaseAdminClient();
  const { flow, flowError } = await fetchFlow(supabase, flowId, owner);
  if (flowError) {
    return json(res, 500, { ok: false, message: "플로우를 불러오지 못했습니다." });
  }
  if (!flow) {
    return json(res, 404, { ok: false, message: "플로우를 찾을 수 없습니다." });
  }

  const { error: linkError } = await supabase
    .from("emotion_flow_note_middles")
    .delete()
    .eq("flow_id", flowId)
    .eq("note_id", noteId);

  if (linkError) {
    return json(res, 500, { ok: false, message: "플로우 연결 삭제에 실패했습니다." });
  }

  const { error: middleError } = await supabase
    .from("emotion_note_middles")
    .delete()
    .eq("flow_id", flowId)
    .or(`from_note_id.eq.${noteId},to_note_id.eq.${noteId}`);

  if (middleError) {
    return json(res, 500, { ok: false, message: "연결 삭제에 실패했습니다." });
  }

  return json(res, 200, { ok: true });
};

const handleDeleteFlow = async (
  res: VercelResponse,
  payload: DeleteFlowPayload,
  owner: { user_id: string | null; device_id: string | null },
) => {
  const flowId = Number(payload.flow_id ?? "");
  if (Number.isNaN(flowId)) {
    return json(res, 400, { ok: false, message: "flow_id가 필요합니다." });
  }

  const supabase = createSupabaseAdminClient();
  const { flow, flowError } = await fetchFlow(supabase, flowId, owner);
  if (flowError) {
    return json(res, 500, { ok: false, message: "플로우를 불러오지 못했습니다." });
  }
  if (!flow) {
    return json(res, 404, { ok: false, message: "플로우를 찾을 수 없습니다." });
  }

  const { error: middleError } = await supabase
    .from("emotion_note_middles")
    .delete()
    .eq("flow_id", flowId);

  if (middleError) {
    return json(res, 500, { ok: false, message: "연결 삭제에 실패했습니다." });
  }

  const { error: linkError } = await supabase
    .from("emotion_flow_note_middles")
    .delete()
    .eq("flow_id", flowId);

  if (linkError) {
    return json(res, 500, { ok: false, message: "플로우 노트 삭제에 실패했습니다." });
  }

  const { error: flowDeleteError } = await supabase
    .from("emotion_flows")
    .delete()
    .eq("id", flowId);

  if (flowDeleteError) {
    return json(res, 500, { ok: false, message: "플로우 삭제에 실패했습니다." });
  }

  return json(res, 200, { ok: true });
};

// DELETE /api/emotion-flow?action=note
export const handleDeleteEmotionNoteFlow = async (
  req: VercelRequest,
  res: VercelResponse,
) => {
  const action = getQueryParam(req, "action");
  if (action !== "note" && action !== "flow") {
    return json(res, 400, { ok: false, message: "지원하지 않는 action입니다." });
  }

  const user = await getUserFromAuthHeader(req.headers.authorization);
  const payload = await readJson<DeleteFlowPayload>(req);
  const deviceId = normalizeDeviceId(payload.deviceId);

  if (!user && !deviceId) {
    return json(res, 401, { ok: false, message: "로그인이 필요합니다." });
  }

  const owner = user
    ? { user_id: user.id, device_id: null }
    : { user_id: null, device_id: deviceId };

  if (action === "flow") {
    return handleDeleteFlow(res, payload, owner);
  }

  return handleDeleteFlowNote(res, payload, owner);
};
