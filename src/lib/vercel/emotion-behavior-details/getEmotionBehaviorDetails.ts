import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createSupabaseAdminClient } from "../../supabase/adminNode.js";
import { getQueryParam, json } from "../_utils.js";
import { resolveIdentityFromQuery } from "../_identity.js";

const parseDetailId = (req: VercelRequest) => {
  const detailIdParam = getQueryParam(req, "detail_id");
  if (detailIdParam == null || detailIdParam === "") return null;
  const detailId = Number(detailIdParam ?? "");
  return Number.isNaN(detailId) ? null : detailId;
};

const parseLimit = (req: VercelRequest) => {
  const raw = Number(getQueryParam(req, "limit") ?? "20");
  if (!Number.isFinite(raw) || raw <= 0) return 20;
  return Math.min(Math.floor(raw), 100);
};

const parseOffset = (req: VercelRequest) => {
  const raw = Number(getQueryParam(req, "offset") ?? "0");
  if (!Number.isFinite(raw) || raw < 0) return 0;
  return Math.floor(raw);
};

// GET /api/emotion-behavior-details
// emotion-behavior-details 상세 조회
export const handleGetEmotionBehaviorDetails = async (
  req: VercelRequest,
  res: VercelResponse,
) => {
  const { user, deviceId } = await resolveIdentityFromQuery(req);
  if (!user && !deviceId) {
    return json(res, 401, { details: [] });
  }

  const detailId = parseDetailId(req);
  const limit = parseLimit(req);
  const offset = parseOffset(req);
  const q = (getQueryParam(req, "q") ?? "").trim();
  const sort = (getQueryParam(req, "sort") ?? "created_desc").trim() === "recorded_desc"
    ? "recorded_desc"
    : "created_desc";
  const safe = q ? q.replace(/,/g, " ") : "";
  const pattern = safe ? `%${safe}%` : "";

  const supabase = createSupabaseAdminClient();

  const isListMode = detailId == null;

  let count: number | null = null;
  let countError: unknown = null;
  if (isListMode) {
    let countQuery = user
      ? supabase
          .from("emotion_behavior_details")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
      : supabase
          .from("emotion_behavior_details")
          .select("id", { count: "exact", head: true })
          .eq("device_id", deviceId)
          .is("user_id", null);
    if (pattern) {
      countQuery = countQuery.or(
        `behavior_label.ilike.${pattern},behavior_description.ilike.${pattern}`,
      );
    }
    const result = await countQuery;
    count = result.count ?? 0;
    countError = result.error;
  }
  if (countError) {
    return json(res, 500, { details: [], message: "행동 상세를 불러오지 못했습니다." });
  }

  let scopedQuery = user
    ? supabase
        .from("emotion_behavior_details")
        .select(
          "id,behavior_label,behavior_description,latest_tracked_on,created_at,emotion_behavior_checks(id,behavior_detail_id,check_label,sort_order,created_at)",
        )
        .eq("user_id", user.id)
    : supabase
        .from("emotion_behavior_details")
        .select(
          "id,behavior_label,behavior_description,latest_tracked_on,created_at,emotion_behavior_checks(id,behavior_detail_id,check_label,sort_order,created_at)",
        )
        .eq("device_id", deviceId)
        .is("user_id", null);
  if (detailId != null) {
    scopedQuery = scopedQuery.eq("id", detailId);
  }
  if (pattern) {
    scopedQuery = scopedQuery.or(
      `behavior_label.ilike.${pattern},behavior_description.ilike.${pattern}`,
    );
  }
  if (sort === "recorded_desc") {
    scopedQuery = scopedQuery
      .order("latest_tracked_on", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });
  } else {
    scopedQuery = scopedQuery.order("created_at", { ascending: false });
  }
  if (isListMode) {
    scopedQuery = scopedQuery.range(offset, offset + limit - 1);
  }
  const { data, error } = await scopedQuery.order("sort_order", {
    ascending: true,
    foreignTable: "emotion_behavior_checks",
  });

  if (error) {
    return json(res, 500, { details: [], message: "행동 상세를 불러오지 못했습니다." });
  }

  const normalized = (data ?? []).map(
    (
      row: {
        emotion_behavior_checks?: Array<{
          id: number;
          behavior_detail_id: number;
          check_label: string;
          sort_order: number;
          created_at: string;
        }>;
        [key: string]: unknown;
      },
    ) => {
      const checks = Array.isArray(row.emotion_behavior_checks)
        ? row.emotion_behavior_checks
        : [];
      return {
        ...row,
        checks,
        emotion_behavior_checks: undefined,
      };
    },
  );

  return json(res, 200, {
    details: normalized,
    total: isListMode ? count ?? 0 : (data ?? []).length,
    limit: isListMode ? limit : (data ?? []).length,
    offset: isListMode ? offset : 0,
  });
};
