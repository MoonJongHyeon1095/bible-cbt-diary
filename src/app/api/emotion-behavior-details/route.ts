import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getUserFromRequest } from "@/lib/auth/session";

const parseNoteId = (request: Request) => {
  const { searchParams } = new URL(request.url);
  const noteId = Number(searchParams.get("note_id") ?? "");
  return Number.isNaN(noteId) ? null : noteId;
};

export async function GET(request: Request) {
  const user = await getUserFromRequest(request);

  if (!user) {
    return NextResponse.json({ details: [] }, { status: 401 });
  }

  const noteId = parseNoteId(request);
  if (!noteId) {
    return NextResponse.json(
      { details: [], message: "note_id가 필요합니다." },
      { status: 400 },
    );
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("emotion_behavior_details")
    .select(
      "id,note_id,behavior_label,behavior_description,error_tags,created_at",
    )
    .eq("user_id", user.id)
    .eq("note_id", noteId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json(
      { details: [], message: "행동 상세를 불러오지 못했습니다." },
      { status: 500 },
    );
  }

  return NextResponse.json({ details: data ?? [] });
}

export async function POST(request: Request) {
  const user = await getUserFromRequest(request);

  if (!user) {
    return NextResponse.json(
      { ok: false, message: "로그인이 필요합니다." },
      { status: 401 },
    );
  }

  const payload = (await request.json()) as {
    note_id?: number;
    behavior_label?: string;
    behavior_description?: string;
    error_tags?: string[];
  };

  const noteId = Number(payload.note_id ?? "");
  if (Number.isNaN(noteId)) {
    return NextResponse.json(
      { ok: false, message: "note_id가 필요합니다." },
      { status: 400 },
    );
  }

  const behaviorLabel = String(payload.behavior_label ?? "").trim();
  const behaviorDescription = String(payload.behavior_description ?? "").trim();
  const errorTags = Array.isArray(payload.error_tags)
    ? payload.error_tags.map((tag) => String(tag))
    : [];

  if (!behaviorLabel || !behaviorDescription) {
    return NextResponse.json(
      { ok: false, message: "행동 라벨과 설명을 입력해주세요." },
      { status: 400 },
    );
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("emotion_behavior_details").insert({
    user_id: user.id,
    note_id: noteId,
    behavior_label: behaviorLabel,
    behavior_description: behaviorDescription,
    error_tags: errorTags,
  });

  if (error) {
    return NextResponse.json(
      { ok: false, message: "행동 상세 저장에 실패했습니다." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
