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
    .from("emotion_note_details")
    .select("id,note_id,automatic_thought,emotion,created_at")
    .eq("user_id", user.id)
    .eq("note_id", noteId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json(
      { details: [], message: "상세 정보를 불러오지 못했습니다." },
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
    automatic_thought?: string;
    emotion?: string;
  };

  const noteId = Number(payload.note_id ?? "");
  if (Number.isNaN(noteId)) {
    return NextResponse.json(
      { ok: false, message: "note_id가 필요합니다." },
      { status: 400 },
    );
  }

  const automaticThought = String(payload.automatic_thought ?? "").trim();
  const emotion = String(payload.emotion ?? "").trim();

  if (!automaticThought || !emotion) {
    return NextResponse.json(
      { ok: false, message: "자동 사고와 감정을 입력해주세요." },
      { status: 400 },
    );
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("emotion_note_details").insert({
    user_id: user.id,
    note_id: noteId,
    automatic_thought: automaticThought,
    emotion,
  });

  if (error) {
    return NextResponse.json(
      { ok: false, message: "상세 저장에 실패했습니다." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request) {
  const user = await getUserFromRequest(request);

  if (!user) {
    return NextResponse.json(
      { ok: false, message: "로그인이 필요합니다." },
      { status: 401 },
    );
  }

  const payload = (await request.json()) as {
    id?: number;
    automatic_thought?: string;
    emotion?: string;
  };

  const detailId = Number(payload.id ?? "");
  if (Number.isNaN(detailId)) {
    return NextResponse.json(
      { ok: false, message: "id가 필요합니다." },
      { status: 400 },
    );
  }

  const updatePayload: {
    automatic_thought?: string;
    emotion?: string;
  } = {};

  if (payload.automatic_thought !== undefined) {
    updatePayload.automatic_thought = String(payload.automatic_thought).trim();
  }
  if (payload.emotion !== undefined) {
    updatePayload.emotion = String(payload.emotion).trim();
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("emotion_note_details")
    .update(updatePayload)
    .eq("id", detailId)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json(
      { ok: false, message: "상세 수정에 실패했습니다." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const user = await getUserFromRequest(request);

  if (!user) {
    return NextResponse.json(
      { ok: false, message: "로그인이 필요합니다." },
      { status: 401 },
    );
  }

  const payload = (await request.json()) as { id?: number };
  const detailId = Number(payload.id ?? "");
  if (Number.isNaN(detailId)) {
    return NextResponse.json(
      { ok: false, message: "id가 필요합니다." },
      { status: 400 },
    );
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("emotion_note_details")
    .delete()
    .eq("id", detailId)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json(
      { ok: false, message: "상세 삭제에 실패했습니다." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
