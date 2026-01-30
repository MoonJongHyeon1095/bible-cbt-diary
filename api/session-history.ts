import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createSupabaseAdminClient } from "../src/lib/supabase/adminNode";
import { getUserFromAuthHeader } from "../src/lib/auth/sessionNode";
import { getQueryParam, json, methodNotAllowed, readJson, handleCors } from "./_utils";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  const user = await getUserFromAuthHeader(req.headers.authorization);

  if (!user) {
    if (req.method === "GET") {
      return json(res, 401, { histories: [] });
    }
    return json(res, 401, { ok: false, message: "로그인이 필요합니다." });
  }

  if (req.method === "GET") {
    const limitParam = Number(getQueryParam(req, "limit") ?? "50");
    const offsetParam = Number(getQueryParam(req, "offset") ?? "0");
    const limit = Number.isNaN(limitParam)
      ? 50
      : Math.min(Math.max(limitParam, 1), 100);
    const offset = Number.isNaN(offsetParam) ? 0 : Math.max(offsetParam, 0);

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("session_history")
      .select(
        "id, timestamp, user_input, emotion_thought_pairs, selected_cognitive_errors, selected_alternative_thought, selected_behavior, bible_verse",
      )
      .eq("user_id", user.id)
      .is("soft_deleted_at", null)
      .order("timestamp", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return json(res, 500, {
        histories: [],
        message: "세션 기록을 불러오지 못했습니다.",
      });
    }

    const histories =
      data?.map((row) => ({
        id: String(row.id),
        timestamp: row.timestamp,
        userInput: row.user_input ?? "",
        emotionThoughtPairs: Array.isArray(row.emotion_thought_pairs)
          ? row.emotion_thought_pairs
          : [],
        selectedCognitiveErrors: row.selected_cognitive_errors ?? [],
        selectedAlternativeThought: row.selected_alternative_thought ?? "",
        selectedBehavior: row.selected_behavior ?? null,
        bibleVerse: row.bible_verse ?? null,
      })) ?? [];

    return json(res, 200, { histories });
  }

  if (req.method === "POST") {
    const payload = await readJson<{
      timestamp?: string;
      user_input?: string;
      emotion_thought_pairs?: unknown;
      selected_cognitive_errors?: unknown;
      selected_alternative_thought?: string | null;
      selected_behavior?: unknown;
      bible_verse?: unknown;
    }>(req);

    const timestamp = String(payload.timestamp ?? "").trim();
    const userInput = String(payload.user_input ?? "").trim();

    if (!timestamp || !userInput) {
      return json(res, 400, { ok: false, message: "필수 입력값이 누락되었습니다." });
    }

    try {
      const supabase = createSupabaseAdminClient();
      const { error } = await supabase.from("session_history").insert({
        user_id: user.id,
        timestamp,
        user_input: userInput,
        emotion_thought_pairs: payload.emotion_thought_pairs ?? [],
        selected_cognitive_errors: payload.selected_cognitive_errors ?? [],
        selected_alternative_thought: payload.selected_alternative_thought ?? "",
        selected_behavior: payload.selected_behavior ?? null,
        bible_verse: payload.bible_verse ?? null,
      });

      if (error) {
        return json(res, 500, { ok: false, message: "세션 저장에 실패했습니다." });
      }

      return json(res, 200, { ok: true });
    } catch (error) {
      console.error("[/api/session-history] error:", error);
      return json(res, 500, { ok: false, message: "세션 저장에 실패했습니다." });
    }
  }

  if (req.method === "DELETE") {
    const deleteAll = getQueryParam(req, "all") === "true";
    const idParam = getQueryParam(req, "id");

    if (!deleteAll && !idParam) {
      return json(res, 400, { ok: false, message: "id가 필요합니다." });
    }

    const supabase = createSupabaseAdminClient();
    const baseQuery = supabase
      .from("session_history")
      .update({ soft_deleted_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .is("soft_deleted_at", null);

    const historyId = Number(idParam ?? "");
    if (!deleteAll && Number.isNaN(historyId)) {
      return json(res, 400, { ok: false, message: "id가 올바르지 않습니다." });
    }

    const { error } = deleteAll
      ? await baseQuery
      : await baseQuery.eq("id", historyId);

    if (error) {
      return json(res, 500, { ok: false, message: "세션 기록을 삭제하지 못했습니다." });
    }

    return json(res, 200, { ok: true });
  }

  return methodNotAllowed(res);
}
