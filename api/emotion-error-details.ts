import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createSupabaseAdminClient } from "../src/lib/supabase/adminNode";
import { getUserFromAuthHeader } from "../src/lib/auth/sessionNode";
import { getQueryParam, json, methodNotAllowed, readJson, handleCors } from "./_utils";

const parseNoteId = (req: VercelRequest) => {
  const noteIdParam = getQueryParam(req, "note_id");
  const noteId = Number(noteIdParam ?? "");
  return Number.isNaN(noteId) ? null : noteId;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  const user = await getUserFromAuthHeader(req.headers.authorization);

  if (!user) {
    if (req.method === "GET") {
      return json(res, 401, { details: [] });
    }
    return json(res, 401, { ok: false, message: "로그인이 필요합니다." });
  }

  if (req.method === "GET") {
    const noteId = parseNoteId(req);
    if (!noteId) {
      return json(res, 400, {
        details: [],
        message: "note_id가 필요합니다.",
      });
    }

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("emotion_error_details")
      .select("id,note_id,error_label,error_description,created_at")
      .eq("user_id", user.id)
      .eq("note_id", noteId)
      .order("created_at", { ascending: true });

    if (error) {
      return json(res, 500, {
        details: [],
        message: "에러 상세를 불러오지 못했습니다.",
      });
    }

    return json(res, 200, { details: data ?? [] });
  }

  if (req.method === "POST") {
    const payload = await readJson<{
      note_id?: number;
      error_label?: string;
      error_description?: string;
      created_at?: string;
    }>(req);

    const noteId = Number(payload.note_id ?? "");
    if (Number.isNaN(noteId)) {
      return json(res, 400, { ok: false, message: "note_id가 필요합니다." });
    }

    const errorLabel = String(payload.error_label ?? "").trim();
    const errorDescription = String(payload.error_description ?? "").trim();

    if (!errorLabel || !errorDescription) {
      return json(res, 400, {
        ok: false,
        message: "에러 라벨과 설명을 입력해주세요.",
      });
    }

    const supabase = createSupabaseAdminClient();
    const insertPayload: {
      user_id: string;
      note_id: number;
      error_label: string;
      error_description: string;
      created_at?: string;
    } = {
      user_id: user.id,
      note_id: noteId,
      error_label: errorLabel,
      error_description: errorDescription,
    };
    if (payload.created_at) {
      insertPayload.created_at = payload.created_at;
    }
    const { error } = await supabase
      .from("emotion_error_details")
      .insert(insertPayload);

    if (error) {
      return json(res, 500, {
        ok: false,
        message: "에러 상세 저장에 실패했습니다.",
      });
    }

    return json(res, 200, { ok: true });
  }

  if (req.method === "PATCH") {
    const payload = await readJson<{
      id?: number;
      error_label?: string;
      error_description?: string;
    }>(req);

    const detailId = Number(payload.id ?? "");
    if (Number.isNaN(detailId)) {
      return json(res, 400, { ok: false, message: "id가 필요합니다." });
    }

    const updatePayload: {
      error_label?: string;
      error_description?: string;
    } = {};

    if (payload.error_label !== undefined) {
      updatePayload.error_label = String(payload.error_label).trim();
    }
    if (payload.error_description !== undefined) {
      updatePayload.error_description = String(payload.error_description).trim();
    }

    const supabase = createSupabaseAdminClient();
    const { error } = await supabase
      .from("emotion_error_details")
      .update(updatePayload)
      .eq("id", detailId)
      .eq("user_id", user.id);

    if (error) {
      return json(res, 500, {
        ok: false,
        message: "에러 상세 수정에 실패했습니다.",
      });
    }

    return json(res, 200, { ok: true });
  }

  if (req.method === "DELETE") {
    const payload = await readJson<{ id?: number }>(req);
    const detailId = Number(payload.id ?? "");
    if (Number.isNaN(detailId)) {
      return json(res, 400, { ok: false, message: "id가 필요합니다." });
    }

    const supabase = createSupabaseAdminClient();
    const { error } = await supabase
      .from("emotion_error_details")
      .delete()
      .eq("id", detailId)
      .eq("user_id", user.id);

    if (error) {
      return json(res, 500, {
        ok: false,
        message: "에러 상세 삭제에 실패했습니다.",
      });
    }

    return json(res, 200, { ok: true });
  }

  return methodNotAllowed(res);
}
