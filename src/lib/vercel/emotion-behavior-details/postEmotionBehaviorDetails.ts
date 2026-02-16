import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createSupabaseAdminClient } from "../../supabase/adminNode.js";
import { getUserFromAuthHeader } from "../../auth/sessionNode.js";
import { json, readJson, normalizeDeviceId } from "../_utils.js";

// POST /api/emotion-behavior-details
// emotion-behavior-details 등록
export const handlePostEmotionBehaviorDetails = async (
  req: VercelRequest,
  res: VercelResponse,
) => {
  const user = await getUserFromAuthHeader(req.headers.authorization);
  const payload = await readJson<{
    note_id?: number | null;
    behavior_label?: string;
    behavior_description?: string;
    checks?: string[];
    created_at?: string;
    deviceId?: string;
  }>(req);

  const deviceId = normalizeDeviceId(payload.deviceId);
  if (!user && !deviceId) {
    return json(res, 401, { ok: false, message: "로그인이 필요합니다." });
  }

  const hasNoteId = payload.note_id !== undefined && payload.note_id !== null;
  const noteId = hasNoteId ? Number(payload.note_id) : null;
  if (hasNoteId && (noteId == null || Number.isNaN(noteId))) {
    return json(res, 400, { ok: false, message: "note_id가 올바르지 않습니다." });
  }

  const behaviorLabel = String(payload.behavior_label ?? "").trim();
  const behaviorDescription = String(payload.behavior_description ?? "").trim();
  const checks = Array.isArray(payload.checks)
    ? payload.checks
        .map((item) => String(item ?? "").trim())
        .filter((item) => item.length > 0)
        .slice(0, 3)
    : [];

  if (!behaviorLabel || !behaviorDescription) {
    return json(res, 400, { ok: false, message: "행동 라벨과 설명을 입력해주세요." });
  }

  const supabase = createSupabaseAdminClient();
  const insertPayload: {
    user_id?: string | null;
    device_id?: string | null;
    note_id: number | null;
    behavior_label: string;
    behavior_description: string;
    created_at?: string;
  } = {
    note_id: noteId,
    behavior_label: behaviorLabel,
    behavior_description: behaviorDescription,
  };

  if (user) {
    insertPayload.user_id = user.id;
  } else {
    insertPayload.user_id = null;
    insertPayload.device_id = deviceId;
  }

  if (payload.created_at) {
    insertPayload.created_at = payload.created_at;
  }

  const { data: inserted, error } = await supabase
    .from("emotion_behavior_details")
    .insert(insertPayload)
    .select("id")
    .maybeSingle();

  if (error || !inserted) {
    return json(res, 500, { ok: false, message: "행동 상세 저장에 실패했습니다." });
  }

  if (checks.length > 0) {
    const rows = checks.map((checkLabel, index) => ({
      behavior_detail_id: inserted.id,
      check_label: checkLabel,
      sort_order: index,
      user_id: user ? user.id : null,
      device_id: user ? null : deviceId,
    }));
    const { error: checkError } = await supabase
      .from("emotion_behavior_checks")
      .insert(rows);
    if (checkError) {
      return json(res, 500, { ok: false, message: "체크리스트 저장에 실패했습니다." });
    }
  }

  return json(res, 200, { ok: true, id: inserted.id });
};
