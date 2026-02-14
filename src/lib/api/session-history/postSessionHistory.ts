"use client";

import type { AccessContext } from "@/lib/types/access";
import type { SessionHistory } from "@/lib/types/sessionTypes";
import { buildApiUrl } from "@/lib/utils/apiBase";
import { resolveAccess } from "@/lib/api/_helpers";

// POST /api/session-history
// session-history 등록
export async function saveSessionHistoryAPI(
  access: AccessContext,
  history: SessionHistory,
) {
  const resolved = resolveAccess(access);
  if (resolved.kind === "blocked") {
    return { ok: false, payload: {} };
  }

  const body = {
    timestamp: history.timestamp,
    user_input: history.userInput,
    emotion_thought_pairs: history.emotionThoughtPairs,
    selected_cognitive_errors: history.selectedCognitiveErrors,
    selected_alternative_thought: history.selectedAlternativeThought,
    selected_behavior: history.selectedBehavior ?? null,
    bible_verse: history.bibleVerse ?? null,
    ...(resolved.kind === "guest" ? { deviceId: resolved.deviceId } : {}),
  };

  const res = await fetch(buildApiUrl("/api/session-history"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(resolved.kind === "auth" ? resolved.headers : {}),
    },
    body: JSON.stringify(body),
  });

  const response = await res.json().catch(() => ({}));
  return { ok: res.ok, payload: response };
}
