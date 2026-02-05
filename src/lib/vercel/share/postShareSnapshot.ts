import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createSupabaseAdminClient } from "../../supabase/adminNode.js";
import { getUserFromAuthHeader } from "../../auth/sessionNode.js";
import { json, readJson } from "../_utils.js";

type ShareSnapshotRequest = {
  noteId?: number;
  selectedThoughtIds?: number[];
  selectedErrorIds?: number[];
  selectedAlternativeIds?: number[];
  selectedBehaviorIds?: number[];
};

const normalizeIds = (value?: number[]) => {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(value.map((id) => Number(id)).filter((id) => Number.isFinite(id))),
  );
};

export const handlePostShareSnapshot = async (
  req: VercelRequest,
  res: VercelResponse,
) => {
  const requestId = req.headers["x-request-id"];
  let supabase;

  try {
    supabase = createSupabaseAdminClient();
  } catch (error) {
    console.error("[share-snap-shots] admin client init failed", {
      requestId,
      error,
    });
    return json(res, 500, { ok: false, message: "Supabase admin client init failed" });
  }

  const user = await getUserFromAuthHeader(req.headers.authorization);
  if (!user) {
    return json(res, 401, { ok: false, message: "로그인이 필요합니다." });
  }

  const payload = await readJson<ShareSnapshotRequest>(req);
  const noteId = Number(payload.noteId);
  if (!Number.isFinite(noteId)) {
    return json(res, 400, { ok: false, message: "noteId가 올바르지 않습니다." });
  }

  const selectedThoughtIds = normalizeIds(payload.selectedThoughtIds);
  const selectedErrorIds = normalizeIds(payload.selectedErrorIds);
  const selectedAlternativeIds = normalizeIds(payload.selectedAlternativeIds);
  const selectedBehaviorIds = normalizeIds(payload.selectedBehaviorIds);

  const { data, error } = await supabase
    .from("emotion_notes")
    .select(
      `
        id,
        title,
        trigger_text,
        emotion_note_details(id,automatic_thought,emotion,created_at),
        emotion_error_details(id,error_label,error_description,created_at),
        emotion_alternative_details(id,alternative,created_at),
        emotion_behavior_details(id,behavior_label,behavior_description,error_tags,created_at)
      `,
    )
    .eq("user_id", user.id)
    .eq("id", noteId)
    .order("created_at", {
      ascending: true,
      foreignTable: "emotion_note_details",
    })
    .order("created_at", {
      ascending: true,
      foreignTable: "emotion_error_details",
    })
    .order("created_at", {
      ascending: true,
      foreignTable: "emotion_alternative_details",
    })
    .order("created_at", {
      ascending: true,
      foreignTable: "emotion_behavior_details",
    })
    .maybeSingle();

  if (error) {
    console.error("[share-snap-shots] note fetch failed", {
      requestId,
      userId: user.id,
      noteId,
      error,
    });
    return json(res, 500, { ok: false, message: "노트를 불러오지 못했습니다." });
  }

  if (!data) {
    return json(res, 404, { ok: false, message: "노트를 찾을 수 없습니다." });
  }

  const thoughtItems = (data.emotion_note_details ?? []).filter((item) =>
    selectedThoughtIds.includes(item.id),
  );
  const errorItems = (data.emotion_error_details ?? []).filter((item) =>
    selectedErrorIds.includes(item.id),
  );
  const alternativeItems = (data.emotion_alternative_details ?? []).filter(
    (item) => selectedAlternativeIds.includes(item.id),
  );
  const behaviorItems = (data.emotion_behavior_details ?? []).filter((item) =>
    selectedBehaviorIds.includes(item.id),
  );

  const totalSelected =
    thoughtItems.length +
    errorItems.length +
    alternativeItems.length +
    behaviorItems.length;

  if (totalSelected === 0) {
    return json(res, 400, {
      ok: false,
      message: "공유할 항목을 최소 1개 선택해주세요.",
    });
  }

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: insertData, error: insertError } = await supabase
    .from("share_snap_shots")
    .insert({
      note_id: noteId,
      user_id: user.id,
      title: data.title,
      trigger_text: data.trigger_text,
      sections: {
        thought: thoughtItems,
        error: errorItems,
        alternative: alternativeItems,
        behavior: behaviorItems,
      },
      expires_at: expiresAt,
    })
    .select("public_id")
    .maybeSingle();

  if (insertError || !insertData) {
    console.error("[share-snap-shots] insert failed", {
      requestId,
      userId: user.id,
      noteId,
      insertError,
    });
    return json(res, 500, { ok: false, message: "공유 링크 생성에 실패했습니다." });
  }

  return json(res, 200, { ok: true, publicId: insertData.public_id });
};
