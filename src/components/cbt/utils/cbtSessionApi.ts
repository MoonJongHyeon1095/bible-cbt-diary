"use client";

import type { AccessContext } from "@/lib/types/access";
import type {
  SelectedCognitiveError,
  SessionHistory,
} from "@/lib/types/cbtTypes";
import { buildApiUrl } from "@/lib/utils/apiBase";
import { buildAuthHeaders } from "@/lib/utils/buildAuthHeaders";
import {
  saveGuestMinimalSession,
  saveGuestSessionHistory,
} from "@/lib/utils/guestStorage";
import { formatAutoTitle } from "./formatAutoTitle";

export type MinimalSavePayload = {
  triggerText: string;
  emotion: string;
  automaticThought: string;
  alternativeThought: string;
  cognitiveError?: SelectedCognitiveError | null;
};

export async function saveMinimalPatternAPI(
  access: AccessContext,
  payload: MinimalSavePayload,
) {
  if (access.mode === "guest") {
    const result = saveGuestMinimalSession({
      title: formatAutoTitle(new Date(), payload.emotion),
      trigger_text: payload.triggerText,
      emotion: payload.emotion,
      automatic_thought: payload.automaticThought,
      alternative: payload.alternativeThought,
      error_label: payload.cognitiveError?.title ?? "",
      error_description: payload.cognitiveError?.detail ?? "",
    });
    return {
      ok: result.response.ok,
      payload: { noteId: result.data?.noteId },
    } as { ok: boolean; payload: { noteId?: number | string } };
  }
  if (access.mode !== "auth" || !access.accessToken) {
    return { ok: false, payload: {} as { noteId?: number | string } };
  }
  const triggerText = payload.triggerText.trim();
  const automaticThought = payload.automaticThought.trim();
  const emotion = payload.emotion.trim();
  const alternativeThought = payload.alternativeThought.trim();
  const errorTitle = payload.cognitiveError?.title?.trim() ?? "";
  const errorDescription = payload.cognitiveError?.detail?.trim() ?? "";

  const res = await fetch(buildApiUrl("/api/minimal-emotion-note"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeaders(access.accessToken),
    },
    body: JSON.stringify({
      title: formatAutoTitle(new Date(), emotion),
      triggerText,
      emotion,
      automaticThought,
      alternativeThought,
      cognitiveError: errorTitle
        ? { title: errorTitle, detail: errorDescription }
        : null,
    }),
  });

  const response = await res.json().catch(() => ({}));
  return { ok: res.ok, payload: response } as {
    ok: boolean;
    payload: { noteId?: number | string };
  };
}

export async function saveSessionHistoryAPI(
  access: AccessContext,
  history: SessionHistory,
) {
  if (access.mode === "guest") {
    const result = saveGuestSessionHistory(history);
    return { ok: result.response.ok, payload: result.data };
  }
  if (access.mode !== "auth" || !access.accessToken) {
    return { ok: false, payload: {} };
  }
  const res = await fetch(buildApiUrl("/api/session-history"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeaders(access.accessToken),
    },
    body: JSON.stringify({
      timestamp: history.timestamp,
      user_input: history.userInput,
      emotion_thought_pairs: history.emotionThoughtPairs,
      selected_cognitive_errors: history.selectedCognitiveErrors,
      selected_alternative_thought: history.selectedAlternativeThought,
      selected_behavior: history.selectedBehavior ?? null,
      bible_verse: history.bibleVerse ?? null,
    }),
  });

  const response = await res.json().catch(() => ({}));
  return { ok: res.ok, payload: response };
}

export async function saveDeepSessionAPI(
  access: AccessContext,
  payload: {
    title: string;
    trigger_text: string;
    emotion: string;
    automatic_thought: string;
    selected_cognitive_error: SelectedCognitiveError | null;
    selected_alternative_thought: string;
    main_id: number;
    sub_ids: number[];
    group_id: number | null;
  },
) {
  if (access.mode !== "auth" || !access.accessToken) {
    return { ok: false, payload: {} as { noteId?: number; groupId?: number } };
  }
  const res = await fetch(buildApiUrl("/api/deep-session"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeaders(access.accessToken),
    },
    body: JSON.stringify(payload),
  });

  const response = await res.json().catch(() => ({}));
  return { ok: res.ok, payload: response } as {
    ok: boolean;
    payload: { noteId?: number; groupId?: number };
  };
}
