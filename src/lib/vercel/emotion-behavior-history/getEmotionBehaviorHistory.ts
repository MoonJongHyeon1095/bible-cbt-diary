import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createSupabaseAdminClient } from "../../supabase/adminNode.js";
import { getQueryParam, json } from "../_utils.js";
import { resolveIdentityFromQuery } from "../_identity.js";

const parseBehaviorDetailId = (req: VercelRequest) => {
  const raw = getQueryParam(req, "behavior_detail_id");
  if (raw == null || raw === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
};

const parseTrackedOn = (req: VercelRequest) => {
  const raw = getQueryParam(req, "tracked_on");
  if (!raw) return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  return raw;
};

// GET /api/emotion-behavior-history
// 행동 기록 조회
export const handleGetEmotionBehaviorHistory = async (
  req: VercelRequest,
  res: VercelResponse,
) => {
  const { user, deviceId } = await resolveIdentityFromQuery(req);
  if (!user && !deviceId) {
    return json(res, 401, { histories: [] });
  }

  const behaviorDetailId = parseBehaviorDetailId(req);
  const trackedOn = parseTrackedOn(req);

  const supabase = createSupabaseAdminClient();
  let baseQuery = supabase
    .from("emotion_behavior_history")
    .select(
      "id,behavior_detail_id,note_id,tracked_on,comments,created_at,emotion_behavior_details(id,behavior_label,behavior_description),emotion_behavior_history_checks(id,history_id,check_id,is_done,created_at,emotion_behavior_checks(check_label))",
    )
    .order("tracked_on", { ascending: false })
    .order("created_at", { ascending: false });

  if (behaviorDetailId != null) {
    baseQuery = baseQuery.eq("behavior_detail_id", behaviorDetailId);
  }
  if (trackedOn) {
    baseQuery = baseQuery.eq("tracked_on", trackedOn);
  }

  const scopedQuery = user
    ? baseQuery.eq("user_id", user.id)
    : baseQuery.eq("device_id", deviceId).is("user_id", null);
  const { data, error } = await scopedQuery;

  if (error) {
    return json(res, 500, { histories: [], message: "행동 기록을 불러오지 못했습니다." });
  }

  const normalized = (data ?? []).map(
    (
      row: {
        emotion_behavior_details?: {
          id: number;
          behavior_label: string;
          behavior_description: string;
        } | null;
        emotion_behavior_history_checks?: Array<{
          id: number;
          history_id: number;
          check_id: number;
          is_done: boolean;
          created_at: string;
          emotion_behavior_checks?: {
            check_label: string;
          } | null;
        }>;
        [key: string]: unknown;
      },
    ) => {
      const checks = Array.isArray(row.emotion_behavior_history_checks)
        ? row.emotion_behavior_history_checks.map((check) => ({
            id: check.id,
            history_id: check.history_id,
            check_id: check.check_id,
            is_done: check.is_done,
            created_at: check.created_at,
            check_label: check.emotion_behavior_checks?.check_label,
          }))
        : [];
      const behaviorDetail =
        row.emotion_behavior_details && typeof row.emotion_behavior_details === "object"
          ? row.emotion_behavior_details
          : null;
      return {
        ...row,
        behavior_detail: behaviorDetail,
        checks,
        emotion_behavior_details: undefined,
        emotion_behavior_history_checks: undefined,
      };
    },
  );

  return json(res, 200, { histories: normalized });
};
