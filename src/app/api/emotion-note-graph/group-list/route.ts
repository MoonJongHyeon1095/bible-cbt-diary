import { getUserFromRequest } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const user = await getUserFromRequest(request);

  if (!user) {
    return NextResponse.json({ groups: [] }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();
  const { data: groups, error } = await supabase
    .from("emotion_note_groups")
    .select("id, created_at, emotion_notes(count)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { groups: [], message: "그룹 정보를 불러오지 못했습니다." },
      { status: 500 },
    );
  }

  const mappedGroups =
    groups?.map((group) => ({
      id: group.id,
      created_at: group.created_at,
      note_count: group.emotion_notes?.[0]?.count ?? 0,
    })) ?? [];

  return NextResponse.json({ groups: mappedGroups });
}
