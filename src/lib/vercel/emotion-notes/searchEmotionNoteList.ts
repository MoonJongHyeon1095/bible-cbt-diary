import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createSupabaseAdminClient } from "../../supabase/adminNode.js";
import { getKstDayRange } from "../../utils/time.js";
import { resolveIdentityFromQuery } from "../_identity.js";
import { getQueryParam, json } from "../_utils.js";

const getDateRange = (dateParam?: string | null) => {
  return getKstDayRange(dateParam ?? new Date().toISOString());
};

// GET /api/emotion-notes?action=search&query=...&start=...&end=...&excludeFlowId=...
// emotion-notes 검색 목록 조회
export const handleSearchEmotionNoteList = async (
  req: VercelRequest,
  res: VercelResponse,
) => {
  const requestId = req.headers["x-request-id"];
  const { user, deviceId } = await resolveIdentityFromQuery(req);
  if (!user && !deviceId) {
    return json(res, 401, { notes: [] });
  }

  const queryParam = (getQueryParam(req, "query") ?? "").trim();
  const excludeFlowIdParam = getQueryParam(req, "excludeFlowId");
  const excludeFlowId = excludeFlowIdParam
    ? Number(excludeFlowIdParam)
    : null;

  const startParam = getQueryParam(req, "start");
  const endParam = getQueryParam(req, "end");
  const hasRange = Boolean(startParam || endParam);
  const hasQuery = Boolean(queryParam);
  if (!hasRange && !hasQuery) {
    return json(res, 400, {
      notes: [],
      message: "검색어 또는 기간이 필요합니다.",
    });
  }
  const { startIso, endIso } = hasRange
    ? (() => {
        const fallback = startParam ?? endParam ?? "";
        if (!startParam || !endParam) {
          return getDateRange(fallback || new Date().toISOString());
        }
        return {
          startIso: new Date(startParam).toISOString(),
          endIso: new Date(endParam).toISOString(),
        };
      })()
    : { startIso: "", endIso: "" };

  const supabase = createSupabaseAdminClient();
  const baseQuery = supabase.from("emotion_notes").select(
    `
      id,
      title,
      trigger_text,
      created_at,
      emotion_flow_note_middles(flow_id),
      emotion_auto_thought_details(emotion),
      emotion_error_details(error_label),
      emotion_behavior_details(behavior_label)
    `,
  );

  const scopedQuery = user
    ? baseQuery.eq("user_id", user.id)
    : baseQuery.eq("device_id", deviceId).is("user_id", null);

  let searchQuery = scopedQuery;
  if (hasQuery) {
    const safeQuery = queryParam.replace(/,/g, " ");
    const likePattern = `%${safeQuery}%`;
    searchQuery = searchQuery.or(
      `title.ilike.${likePattern},trigger_text.ilike.${likePattern}`,
    );
  }

  if (hasRange) {
    searchQuery = searchQuery
      .gte("created_at", startIso)
      .lt("created_at", endIso);
  }

  const { data, error } = await searchQuery.order("created_at", {
    ascending: false,
  });

  if (error) {
    console.error("[emotion-notes] search query failed", {
      requestId,
      userId: user?.id ?? null,
      startIso,
      endIso,
      query: queryParam,
      error,
    });
    return json(res, 500, {
      notes: [],
      message: "노트를 불러오지 못했습니다.",
    });
  }

  let notes =
    data?.map((note) => {
      const emotionLabels = Array.from(
        new Set(
          (note.emotion_auto_thought_details ?? [])
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
      const flowIds = Array.from(
        new Set(
          (note.emotion_flow_note_middles ?? [])
            .map((detail) => Number(detail.flow_id))
            .filter((id) => Number.isFinite(id)),
        ),
      );

      return {
        id: note.id,
        title: note.title,
        trigger_text: note.trigger_text,
        created_at: note.created_at,
        emotion_labels: emotionLabels,
        error_labels: errorLabels,
        behavior_labels: behaviorLabels,
        flow_ids: flowIds,
      };
    }) ?? [];

  if (excludeFlowId && Number.isFinite(excludeFlowId)) {
    notes = notes.filter((note) => !note.flow_ids.includes(excludeFlowId));
  }

  return json(res, 200, { notes });
};
