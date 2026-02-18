import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createSupabaseAdminClient } from "../../supabase/adminNode.js";
import { getQueryParam, json } from "../_utils.js";
import { resolveIdentityFromQuery } from "../_identity.js";

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

  const trackedOn = parseTrackedOn(req);

  const supabase = createSupabaseAdminClient();
  let baseQuery = supabase
    .from("emotion_behavior_history")
    .select(
      "id,tracked_on,comments,created_at,emotion_behavior_history_checks(id,history_id,check_id,is_done,created_at,emotion_behavior_checks(check_label))",
    )
    .order("tracked_on", { ascending: false })
    .order("created_at", { ascending: false });

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

  const normalized = (data ?? []).map((row) => {
    const rowAny = row as {
      emotion_behavior_history_checks?: Array<{
        id: number;
        history_id: number;
        check_id: number;
        is_done: boolean;
        created_at: string;
        emotion_behavior_checks?:
          | {
              check_label: string;
            }
          | Array<{
              check_label: string;
            }>
          | null;
      }> | null;
      [key: string]: unknown;
    };

    const checks = Array.isArray(rowAny.emotion_behavior_history_checks)
      ? rowAny.emotion_behavior_history_checks.map((check) => {
          const checkRef = Array.isArray(check.emotion_behavior_checks)
            ? check.emotion_behavior_checks[0]
            : check.emotion_behavior_checks;
          return {
            id: check.id,
            history_id: check.history_id,
            check_id: check.check_id,
            is_done: check.is_done,
            created_at: check.created_at,
            check_label: checkRef?.check_label,
          };
        })
      : [];

    return {
      ...rowAny,
      checks,
      emotion_behavior_history_checks: undefined,
    };
  });

  return json(res, 200, { histories: normalized });
};
