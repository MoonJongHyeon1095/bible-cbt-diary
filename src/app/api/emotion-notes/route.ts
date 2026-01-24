import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getUserFromRequest } from "@/lib/auth/session";

const getDateRange = (dateParam?: string | null) => {
  const baseDate = dateParam ? new Date(dateParam) : new Date();
  const start = new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate(),
    0,
    0,
    0,
  );
  const end = new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate() + 1,
    0,
    0,
    0,
  );

  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  };
};

export async function GET(request: Request) {
  const user = await getUserFromRequest(request);

  if (!user) {
    return NextResponse.json({ notes: [] }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const startParam = searchParams.get("start");
  const endParam = searchParams.get("end");
  const { startIso, endIso } =
    startParam && endParam
      ? { startIso: new Date(startParam).toISOString(), endIso: new Date(endParam).toISOString() }
      : getDateRange(searchParams.get("date"));
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("emotion_notes")
    .select("id,title,trigger_text,behavior,frequency,created_at")
    .eq("user_id", user.id)
    .gte("created_at", startIso)
    .lt("created_at", endIso)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { notes: [], message: "노트를 불러오지 못했습니다." },
      { status: 500 },
    );
  }

  return NextResponse.json({ notes: data ?? [] });
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
    title?: string;
    trigger_text?: string;
    behavior?: string;
    frequency?: number;
  };

  const title = String(payload.title ?? "").trim();
  const triggerText = String(payload.trigger_text ?? "").trim();
  const behavior = String(payload.behavior ?? "").trim();
  const frequencyValue = Number(payload.frequency ?? 1);
  const frequency = Number.isNaN(frequencyValue) ? 1 : frequencyValue;

  if (!title || !triggerText) {
    return NextResponse.json(
      { ok: false, message: "제목과 트리거를 입력해주세요." },
      { status: 400 },
    );
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("emotion_notes").insert({
    user_id: user.id,
    title,
    trigger_text: triggerText,
    behavior,
    frequency,
  });

  if (error) {
    return NextResponse.json(
      { ok: false, message: "기록 저장에 실패했습니다." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, message: "기록이 저장되었습니다." });
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
    title?: string;
    trigger_text?: string;
    behavior?: string;
    frequency?: number;
  };

  const noteId = Number(payload.id ?? "");
  if (Number.isNaN(noteId)) {
    return NextResponse.json(
      { ok: false, message: "id가 필요합니다." },
      { status: 400 },
    );
  }

  const updatePayload: {
    title?: string;
    trigger_text?: string;
    behavior?: string;
    frequency?: number;
    updated_at?: string;
  } = {
    updated_at: new Date().toISOString(),
  };

  if (payload.title !== undefined) {
    updatePayload.title = String(payload.title).trim();
  }
  if (payload.trigger_text !== undefined) {
    updatePayload.trigger_text = String(payload.trigger_text).trim();
  }
  if (payload.behavior !== undefined) {
    updatePayload.behavior = String(payload.behavior).trim();
  }
  if (payload.frequency !== undefined) {
    const frequencyValue = Number(payload.frequency);
    updatePayload.frequency = Number.isNaN(frequencyValue) ? 1 : frequencyValue;
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("emotion_notes")
    .update(updatePayload)
    .eq("id", noteId)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json(
      { ok: false, message: "기록 수정에 실패했습니다." },
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
  const noteId = Number(payload.id ?? "");
  if (Number.isNaN(noteId)) {
    return NextResponse.json(
      { ok: false, message: "id가 필요합니다." },
      { status: 400 },
    );
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("emotion_notes")
    .delete()
    .eq("id", noteId)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json(
      { ok: false, message: "기록 삭제에 실패했습니다." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
