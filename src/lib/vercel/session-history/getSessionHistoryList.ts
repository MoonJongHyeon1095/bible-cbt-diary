import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createSupabaseAdminClient } from "../../supabase/adminNode.js";
import { getQueryParam, json } from "../_utils.js";
import { resolveIdentityFromQuery } from "../_identity.js";

// GET /api/session-history?limit=...&offset=...
// session-history 목록 조회
export const handleGetSessionHistoryList = async (
  req: VercelRequest,
  res: VercelResponse,
) => {
  const { user, deviceId } = await resolveIdentityFromQuery(req);
  if (!user && !deviceId) {
    return json(res, 401, { histories: [] });
  }

  const limitParam = Number(getQueryParam(req, "limit") ?? "50");
  const offsetParam = Number(getQueryParam(req, "offset") ?? "0");
  const limit = Number.isNaN(limitParam)
    ? 50
    : Math.min(Math.max(limitParam, 1), 100);
  const offset = Number.isNaN(offsetParam) ? 0 : Math.max(offsetParam, 0);

  const supabase = createSupabaseAdminClient();
  const baseQuery = supabase
    .from("session_history")
    .select(
      "id, timestamp, user_input, emotion_thought_pairs, selected_cognitive_errors, selected_alternative_thought, selected_behavior, bible_verse",
    )
    .is("soft_deleted_at", null)
    .order("timestamp", { ascending: false })
    .range(offset, offset + limit - 1);

  const scopedQuery = user
    ? baseQuery.eq("user_id", user.id)
    : baseQuery.eq("device_id", deviceId).is("user_id", null);

  const { data, error } = await scopedQuery;

  if (error) {
    return json(res, 500, { histories: [], message: "세션 기록을 불러오지 못했습니다." });
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
};
