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
    .from("emotion_alternative_details")
    .select("id,note_id,alternative,created_at")
    .eq("user_id", user.id)
    .eq("note_id", noteId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json(
      { details: [], message: "대안 사고를 불러오지 못했습니다." },
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
    alternative?: string;
    created_at?: string;
  };

  const noteId = Number(payload.note_id ?? "");
  if (Number.isNaN(noteId)) {
    return NextResponse.json(
      { ok: false, message: "note_id가 필요합니다." },
      { status: 400 },
    );
  }

  const alternative = String(payload.alternative ?? "").trim();
  if (!alternative) {
    return NextResponse.json(
      { ok: false, message: "대안 사고를 입력해주세요." },
      { status: 400 },
    );
  }

  const supabase = createSupabaseAdminClient();
  const insertPayload: {
    user_id: string;
    note_id: number;
    alternative: string;
    created_at?: string;
  } = {
    user_id: user.id,
    note_id: noteId,
    alternative,
  };
  if (payload.created_at) {
    insertPayload.created_at = payload.created_at;
  }
  const { error } = await supabase
    .from("emotion_alternative_details")
    .insert(insertPayload);

  if (error) {
    return NextResponse.json(
      { ok: false, message: "대안 사고 저장에 실패했습니다." },
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
    alternative?: string;
  };

  const detailId = Number(payload.id ?? "");
  if (Number.isNaN(detailId)) {
    return NextResponse.json(
      { ok: false, message: "id가 필요합니다." },
      { status: 400 },
    );
  }

  const updatePayload: { alternative?: string } = {};
  if (payload.alternative !== undefined) {
    updatePayload.alternative = String(payload.alternative).trim();
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("emotion_alternative_details")
    .update(updatePayload)
    .eq("id", detailId)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json(
      { ok: false, message: "대안 사고 수정에 실패했습니다." },
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
    .from("emotion_alternative_details")
    .delete()
    .eq("id", detailId)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json(
      { ok: false, message: "대안 사고 삭제에 실패했습니다." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
