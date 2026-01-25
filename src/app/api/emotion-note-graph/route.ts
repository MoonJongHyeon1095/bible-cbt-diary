import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getUserFromRequest } from "@/lib/auth/session";

export async function GET(request: Request) {
  const user = await getUserFromRequest(request);

  if (!user) {
    return NextResponse.json({ notes: [], middles: [] }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const groupIdParam = searchParams.get("groupId");
  const groupId = Number(groupIdParam);

  if (!groupIdParam || Number.isNaN(groupId)) {
    return NextResponse.json(
      { notes: [], middles: [], message: "groupId가 필요합니다." },
      { status: 400 },
    );
  }

  const supabase = createSupabaseAdminClient();
  const { data: notes, error: notesError } = await supabase
    .from("emotion_notes")
    .select(
      `
      id,
      title,
      trigger_text,
      created_at,
      group_id,
      emotion_note_details(id,note_id,automatic_thought,emotion,created_at),
      emotion_error_details(id,note_id,error_label,error_description,created_at),
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
    .eq("group_id", groupId)
    .order("created_at", { ascending: true });

  if (notesError) {
    return NextResponse.json(
      { notes: [], middles: [], message: "노트를 불러오지 못했습니다." },
      { status: 500 },
    );
  }

  const { data: middles, error: middleError } = await supabase
    .from("emotion_note_middles")
    .select("id,from_note_id,to_note_id,created_at")
    .eq("group_id", groupId)
    .order("created_at", { ascending: true });

  if (middleError) {
    return NextResponse.json(
      { notes: notes ?? [], middles: [], message: "연결 정보를 불러오지 못했습니다." },
      { status: 500 },
    );
  }

  const mappedNotes =
    notes?.map((note) => {
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
        created_at: note.created_at,
        group_id: note.group_id ?? null,
        emotion_labels: emotionLabels,
        error_labels: errorLabels,
        behavior_labels: behaviorLabels,
        thought_details: note.emotion_note_details ?? [],
        error_details: note.emotion_error_details ?? [],
        behavior_details: note.emotion_behavior_details ?? [],
      };
    }) ?? [];

  return NextResponse.json({ notes: mappedNotes, middles: middles ?? [] });
}
