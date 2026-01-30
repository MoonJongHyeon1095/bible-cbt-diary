import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createSupabaseAdminClient } from "../../src/lib/supabase/admin";
import { getUserFromAuthHeader } from "../../src/lib/auth/session";
import { json, methodNotAllowed, handleCors } from "../_utils";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  if (req.method !== "GET") {
    return methodNotAllowed(res);
  }

  const user = await getUserFromAuthHeader(req.headers.authorization);

  if (!user) {
    return json(res, 401, { groups: [] });
  }

  const supabase = createSupabaseAdminClient();
  const { data: groups, error } = await supabase
    .from("emotion_note_groups")
    .select("id, created_at, emotion_notes(count)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

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
}
