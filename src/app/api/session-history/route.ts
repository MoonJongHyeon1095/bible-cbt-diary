import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getUserFromRequest } from "@/lib/auth/session";

export async function POST(request: Request) {
  const user = await getUserFromRequest(request);

  if (!user) {
    return NextResponse.json(
      { ok: false, message: "로그인이 필요합니다." },
      { status: 401 },
    );
  }

  const payload = (await request.json().catch(() => ({}))) as {
    timestamp?: string;
    user_input?: string;
    emotion_thought_pairs?: unknown;
    selected_cognitive_errors?: unknown;
    selected_alternative_thought?: string | null;
    selected_behavior?: unknown;
    bible_verse?: unknown;
  };

  const timestamp = String(payload.timestamp ?? "").trim();
  const userInput = String(payload.user_input ?? "").trim();

  if (!timestamp || !userInput) {
    return NextResponse.json(
      { ok: false, message: "필수 입력값이 누락되었습니다." },
      { status: 400 },
    );
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("session_history").insert({
      user_id: user.id,
      timestamp,
      user_input: userInput,
      emotion_thought_pairs: payload.emotion_thought_pairs ?? [],
      selected_cognitive_errors: payload.selected_cognitive_errors ?? [],
      selected_alternative_thought: payload.selected_alternative_thought ?? "",
      selected_behavior: payload.selected_behavior ?? null,
      bible_verse: payload.bible_verse ?? null,
    });

    if (error) {
      return NextResponse.json(
        { ok: false, message: "세션 저장에 실패했습니다." },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[/api/session-history] error:", error);
    return NextResponse.json(
      { ok: false, message: "세션 저장에 실패했습니다." },
      { status: 500 },
    );
  }
}
