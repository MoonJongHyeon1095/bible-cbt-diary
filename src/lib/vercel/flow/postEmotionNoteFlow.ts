import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createSupabaseAdminClient } from "../../supabase/adminNode.js";
import { json, normalizeDeviceId } from "../_utils.js";
import { getUserFromAuthHeader } from "../../auth/sessionNode.js";

type EnsureFlowPayload = {
  note_id?: number;
  flow_id?: number;
  deviceId?: string;
};

const fetchNote = async (
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  noteId: number,
  owner: { user_id: string | null; device_id: string | null },
) => {
  const noteQuery = supabase
    .from("emotion_notes")
    .select("id, title, trigger_text")
    .eq("id", noteId);
  const { data: note, error: noteError } = owner.user_id
    ? await noteQuery.eq("user_id", owner.user_id).maybeSingle()
    : await noteQuery.eq("device_id", owner.device_id).is("user_id", null).maybeSingle();

  return { note, noteError };
};

const attachNoteToFlow = async (
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  noteId: number,
  flowId: number,
) => {
  return supabase
    .from("emotion_flow_note_middles")
    .upsert(
      {
        flow_id: flowId,
        note_id: noteId,
      },
      { onConflict: "flow_id,note_id" },
    );
};

const fetchFlow = async (
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  flowId: number,
  owner: { user_id: string | null; device_id: string | null },
) => {
  const flowQuery = supabase
    .from("emotion_flows")
    .select("id")
    .eq("id", flowId);
  const { data: flow, error: flowError } = owner.user_id
    ? await flowQuery.eq("user_id", owner.user_id).maybeSingle()
    : await flowQuery.eq("device_id", owner.device_id).is("user_id", null).maybeSingle();

  return { flow, flowError };
};

const handleFlowAttach = async (
  res: VercelResponse,
  payload: EnsureFlowPayload,
  owner: { user_id: string | null; device_id: string | null },
) => {
  const noteId = Number(payload.note_id ?? "");
  const flowId = Number(payload.flow_id ?? "");
  if (Number.isNaN(noteId) || Number.isNaN(flowId)) {
    return json(res, 400, {
      ok: false,
      message: "note_id 또는 flow_id가 올바르지 않습니다.",
    });
  }

  const supabase = createSupabaseAdminClient();
  const { note, noteError } = await fetchNote(supabase, noteId, owner);
  if (noteError) {
    return json(res, 500, { ok: false, message: "노트를 불러오지 못했습니다." });
  }
  if (!note) {
    return json(res, 404, { ok: false, message: "노트를 찾을 수 없습니다." });
  }

  const { flow, flowError } = await fetchFlow(supabase, flowId, owner);
  if (flowError) {
    return json(res, 500, { ok: false, message: "플로우를 불러오지 못했습니다." });
  }
  if (!flow) {
    return json(res, 404, { ok: false, message: "플로우를 찾을 수 없습니다." });
  }

  const { error: linkError } = await attachNoteToFlow(supabase, noteId, flowId);
  if (linkError) {
    return json(res, 500, { ok: false, message: "플로우 연결에 실패했습니다." });
  }

  return json(res, 200, { ok: true, flowId });
};

const handleFlowCreate = async (
  req: VercelRequest,
  res: VercelResponse,
  payload: EnsureFlowPayload,
  owner: { user_id: string | null; device_id: string | null },
) => {
  const noteId = Number(payload.note_id ?? "");
  if (Number.isNaN(noteId)) {
    return json(res, 400, { ok: false, message: "note_id가 올바르지 않습니다." });
  }

  const supabase = createSupabaseAdminClient();
  const { note, noteError } = await fetchNote(supabase, noteId, owner);
  if (noteError) {
    return json(res, 500, { ok: false, message: "노트를 불러오지 못했습니다." });
  }
  if (!note) {
    return json(res, 404, { ok: false, message: "노트를 찾을 수 없습니다." });
  }

  const title = String(note.title ?? "").trim() || "감정 기록";
  const description = String(note.trigger_text ?? "").trim();

  const { data: flow, error: flowCreateError } = await supabase
    .from("emotion_flows")
    .insert({
      ...owner,
      title,
      description,
    })
    .select("id")
    .single();

  if (flowCreateError || !flow) {
    return json(res, 500, { ok: false, message: "플로우 생성에 실패했습니다." });
  }

  const { error: linkError } = await attachNoteToFlow(supabase, noteId, flow.id);
  if (linkError) {
    return json(res, 500, { ok: false, message: "플로우 연결에 실패했습니다." });
  }

  return json(res, 200, { ok: true, flowId: flow.id });
};

// POST /api/emotion-flow
// emotion-flow 등록
export const handlePostEmotionNoteFlow = async (
  req: VercelRequest,
  res: VercelResponse,
  payload: EnsureFlowPayload,
) => {
  const user = await getUserFromAuthHeader(req.headers.authorization);
  const deviceId = normalizeDeviceId(payload.deviceId);

  if (!user && !deviceId) {
    return json(res, 401, { ok: false, message: "로그인이 필요합니다." });
  }

  const owner = user
    ? { user_id: user.id, device_id: null }
    : { user_id: null, device_id: deviceId };

  if (payload.flow_id !== undefined && payload.flow_id !== null) {
    return handleFlowAttach(res, payload, owner);
  }

  return handleFlowCreate(req, res, payload, owner);
};
