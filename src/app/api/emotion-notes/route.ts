import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getUserFromRequest } from "@/lib/auth/session";
import { getKstDayRange } from "@/lib/time";

const getDateRange = (dateParam?: string | null) => {
  return getKstDayRange(dateParam ?? new Date());
};

export async function GET(request: Request) {
  const user = await getUserFromRequest(request);

  if (!user) {
    return NextResponse.json({ notes: [] }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const idParam = searchParams.get("id");

  if (idParam) {
    const noteId = Number(idParam);
    if (Number.isNaN(noteId)) {
      return NextResponse.json(
        { note: null, message: "id가 올바르지 않습니다." },
        { status: 400 },
      );
    }

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("emotion_notes")
      .select(
        `
        id,
        title,
        trigger_text,
        group_id,
        created_at,
        emotion_note_details(id,note_id,automatic_thought,emotion,created_at),
        emotion_error_details(id,note_id,error_label,error_description,created_at),
        emotion_alternative_details(id,note_id,alternative,created_at),
        emotion_behavior_details(
          id,
          note_id,
          behavior_label,
          behavior_description,
          error_tags,
          created_at
        )
      `,
      )
      .eq("user_id", user.id)
      .eq("id", noteId)
      .order("created_at", { ascending: true, foreignTable: "emotion_note_details" })
      .order("created_at", { ascending: true, foreignTable: "emotion_error_details" })
      .order("created_at", { ascending: true, foreignTable: "emotion_alternative_details" })
      .order("created_at", { ascending: true, foreignTable: "emotion_behavior_details" })
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { note: null, message: "노트를 불러오지 못했습니다." },
        { status: 500 },
      );
    }

    const note = data
      ? {
          id: data.id,
          title: data.title,
          trigger_text: data.trigger_text,
          group_id: data.group_id ?? null,
          created_at: data.created_at,
          thought_details: data.emotion_note_details ?? [],
          error_details: data.emotion_error_details ?? [],
          alternative_details: data.emotion_alternative_details ?? [],
          behavior_details: data.emotion_behavior_details ?? [],
        }
      : null;

    return NextResponse.json({ note });
  }

  const startParam = searchParams.get("start");
  const endParam = searchParams.get("end");
  const { startIso, endIso } =
    startParam && endParam
      ? {
          startIso: new Date(startParam).toISOString(),
          endIso: new Date(endParam).toISOString(),
        }
      : getDateRange(searchParams.get("date"));
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("emotion_notes")
    .select(
      `
      id,
      title,
      trigger_text,
      group_id,
      created_at,
      emotion_note_details(emotion),
      emotion_error_details(error_label),
      emotion_behavior_details(behavior_label)
    `,
    )
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

  const notes =
    data?.map((note) => {
      const emotionLabels = Array.from(
        new Set(
          (note.emotion_note_details ?? [])
            .map((detail) => detail.emotion)
            .filter(Boolean),
        ),
      );
      const errorLabels = Array.from(
        new Set(
          (note.emotion_error_details ?? [])
            .map((detail) => detail.error_label)
            .filter(Boolean),
        ),
      );
      const behaviorLabels = Array.from(
        new Set(
          (note.emotion_behavior_details ?? [])
            .map((detail) => detail.behavior_label)
            .filter(Boolean),
        ),
      );

      return {
        id: note.id,
        title: note.title,
        trigger_text: note.trigger_text,
        group_id: note.group_id ?? null,
        created_at: note.created_at,
        emotion_labels: emotionLabels,
        error_labels: errorLabels,
        behavior_labels: behaviorLabels,
      };
    }) ?? [];

  return NextResponse.json({ notes });
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
  };

  const title = String(payload.title ?? "").trim();
  const triggerText = String(payload.trigger_text ?? "").trim();

  if (!title || !triggerText) {
    return NextResponse.json(
      { ok: false, message: "제목과 트리거를 입력해주세요." },
      { status: 400 },
    );
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("emotion_notes")
    .insert({
      user_id: user.id,
      title,
      trigger_text: triggerText,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json(
      { ok: false, message: "기록 저장에 실패했습니다." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    message: "기록이 저장되었습니다.",
    noteId: data?.id ?? null,
  });
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
