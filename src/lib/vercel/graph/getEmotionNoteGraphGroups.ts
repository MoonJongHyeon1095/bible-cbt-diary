import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createSupabaseAdminClient } from "../../supabase/adminNode.js";
import { json } from "../_utils.js";
import { resolveIdentityFromQuery } from "../_identity.js";

export const handleGetEmotionNoteGraphGroups = async (
  req: VercelRequest,
  res: VercelResponse,
) => {
  const { user, deviceId } = await resolveIdentityFromQuery(req);
  if (!user && !deviceId) {
    return json(res, 401, { groups: [] });
  }

  const supabase = createSupabaseAdminClient();
  const baseQuery = supabase
    .from("emotion_note_groups")
    .select("id, created_at, emotion_notes(count)")
    .order("created_at", { ascending: false });

  const scopedQuery = user
    ? baseQuery.eq("user_id", user.id)
    : baseQuery.eq("device_id", deviceId).is("user_id", null);

  const { data: groups, error } = await scopedQuery;

  if (error) {
    return json(res, 500, {
      groups: [],
      message: "그룹 정보를 불러오지 못했습니다.",
    });
  }

  const mappedGroups =
    groups?.map((group) => ({
      id: group.id,
      created_at: group.created_at,
      note_count: group.emotion_notes?.[0]?.count ?? 0,
    })) ?? [];

  return json(res, 200, { groups: mappedGroups });
};
