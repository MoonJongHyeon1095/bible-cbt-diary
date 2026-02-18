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

const normalizeIso = (raw: string | null) => {
  if (!raw) return null;
  const value = raw.trim();
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return value;
};

const selectFields =
  "id,behavior_label,behavior_description,is_pinned,latest_tracked_on,created_at,emotion_behavior_checks(id,behavior_detail_id,check_label,sort_order,created_at)";

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
  const isListMode = detailId == null;
  const q = (getQueryParam(req, "q") ?? "").trim();
  const sort = (getQueryParam(req, "sort") ?? "created_desc").trim() === "recorded_desc"
    ? "recorded_desc"
    : "created_desc";
  const createdFrom = normalizeIso(getQueryParam(req, "created_from"));
  const createdTo = normalizeIso(getQueryParam(req, "created_to"));
  const includePinned = (getQueryParam(req, "include_pinned") ?? "").trim() === "true";
  const hasCreatedRange = createdFrom != null && createdTo != null;
  const includePinnedInRangeList = isListMode && includePinned && hasCreatedRange;
  const safe = q ? q.replace(/,/g, " ") : "";
  const pattern = safe ? `%${safe}%` : "";

  const supabase = createSupabaseAdminClient();

  let count: number | null = null;
  if (isListMode) {
    if (includePinnedInRangeList) {
      let pinnedCountQuery = user
        ? supabase.from("emotion_behavior_details").select("id").eq("user_id", user.id)
        : supabase
            .from("emotion_behavior_details")
            .select("id")
            .eq("device_id", deviceId)
            .is("user_id", null);
      pinnedCountQuery = pinnedCountQuery.eq("is_pinned", true);

      let datedCountQuery = user
        ? supabase.from("emotion_behavior_details").select("id").eq("user_id", user.id)
        : supabase
            .from("emotion_behavior_details")
            .select("id")
            .eq("device_id", deviceId)
            .is("user_id", null);
      datedCountQuery = datedCountQuery.gte("created_at", createdFrom).lt("created_at", createdTo);

      if (pattern) {
        const condition = `behavior_label.ilike.${pattern},behavior_description.ilike.${pattern}`;
        pinnedCountQuery = pinnedCountQuery.or(condition);
        datedCountQuery = datedCountQuery.or(condition);
      }

      const [{ data: pinnedRows, error: pinnedError }, { data: datedRows, error: datedError }] =
        await Promise.all([pinnedCountQuery, datedCountQuery]);
      if (pinnedError || datedError) {
        return json(res, 500, { details: [], message: "행동 상세를 불러오지 못했습니다." });
      }
      const idSet = new Set<number>();
      for (const row of pinnedRows ?? []) idSet.add(row.id);
      for (const row of datedRows ?? []) idSet.add(row.id);
      count = idSet.size;
    } else {
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
      if (hasCreatedRange) {
        countQuery = countQuery.gte("created_at", createdFrom).lt("created_at", createdTo);
      }
      const result = await countQuery;
      if (result.error) {
        return json(res, 500, { details: [], message: "행동 상세를 불러오지 못했습니다." });
      }
      count = result.count ?? 0;
    }
  }

  let rows:
    | Array<{
        id: number;
        behavior_label: string;
        behavior_description: string;
        is_pinned: boolean;
        latest_tracked_on: string | null;
        created_at: string;
        emotion_behavior_checks?: Array<{
          id: number;
          behavior_detail_id: number;
          check_label: string;
          sort_order: number;
          created_at: string;
        }>;
      }>
    | null = null;

  if (includePinnedInRangeList) {
    let pinnedQuery = user
      ? supabase.from("emotion_behavior_details").select(selectFields).eq("user_id", user.id)
      : supabase
          .from("emotion_behavior_details")
          .select(selectFields)
          .eq("device_id", deviceId)
          .is("user_id", null);
    pinnedQuery = pinnedQuery.eq("is_pinned", true);
    pinnedQuery = sort === "recorded_desc"
      ? pinnedQuery
          .order("latest_tracked_on", { ascending: false, nullsFirst: false })
          .order("created_at", { ascending: false })
      : pinnedQuery.order("created_at", { ascending: false });
    pinnedQuery = pinnedQuery.order("sort_order", {
      ascending: true,
      foreignTable: "emotion_behavior_checks",
    });

    let datedQuery = user
      ? supabase.from("emotion_behavior_details").select(selectFields).eq("user_id", user.id)
      : supabase
          .from("emotion_behavior_details")
          .select(selectFields)
          .eq("device_id", deviceId)
          .is("user_id", null);
    datedQuery = datedQuery.gte("created_at", createdFrom).lt("created_at", createdTo);
    datedQuery = sort === "recorded_desc"
      ? datedQuery
          .order("latest_tracked_on", { ascending: false, nullsFirst: false })
          .order("created_at", { ascending: false })
      : datedQuery.order("created_at", { ascending: false });
    datedQuery = datedQuery.order("sort_order", {
      ascending: true,
      foreignTable: "emotion_behavior_checks",
    });

    if (pattern) {
      const condition = `behavior_label.ilike.${pattern},behavior_description.ilike.${pattern}`;
      pinnedQuery = pinnedQuery.or(condition);
      datedQuery = datedQuery.or(condition);
    }

    const [{ data: pinnedRows, error: pinnedError }, { data: datedRows, error: datedError }] =
      await Promise.all([pinnedQuery, datedQuery]);
    if (pinnedError || datedError) {
      return json(res, 500, { details: [], message: "행동 상세를 불러오지 못했습니다." });
    }

    const byId = new Map<number, NonNullable<typeof pinnedRows>[number]>();
    for (const row of pinnedRows ?? []) byId.set(row.id, row);
    for (const row of datedRows ?? []) byId.set(row.id, row);

    const merged = Array.from(byId.values());
    merged.sort((a, b) => {
      if (sort === "recorded_desc") {
        const aRecorded = a.latest_tracked_on ?? "";
        const bRecorded = b.latest_tracked_on ?? "";
        if (aRecorded !== bRecorded) return bRecorded.localeCompare(aRecorded);
      }
      return b.created_at.localeCompare(a.created_at);
    });
    rows = merged.slice(offset, offset + limit);
  } else {
    let scopedQuery = user
      ? supabase.from("emotion_behavior_details").select(selectFields).eq("user_id", user.id)
      : supabase
          .from("emotion_behavior_details")
          .select(selectFields)
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
    if (hasCreatedRange) {
      scopedQuery = scopedQuery.gte("created_at", createdFrom).lt("created_at", createdTo);
    }
    if (isListMode) {
      scopedQuery = scopedQuery.range(offset, offset + limit - 1);
    }
    scopedQuery = sort === "recorded_desc"
      ? scopedQuery
          .order("latest_tracked_on", { ascending: false, nullsFirst: false })
          .order("created_at", { ascending: false })
      : scopedQuery.order("created_at", { ascending: false });
    const { data, error } = await scopedQuery.order("sort_order", {
      ascending: true,
      foreignTable: "emotion_behavior_checks",
    });
    if (error) {
      return json(res, 500, { details: [], message: "행동 상세를 불러오지 못했습니다." });
    }
    rows = data;
  }

  const normalized = (rows ?? []).map(
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
    total: isListMode ? count ?? 0 : (rows ?? []).length,
    limit: isListMode ? limit : (rows ?? []).length,
    offset: isListMode ? offset : 0,
  });
};
