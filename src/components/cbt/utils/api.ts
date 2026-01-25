"use client";

import { buildAuthHeaders } from "@/components/utils/api";
import type { SelectedCognitiveError, SessionHistory } from "@/lib/cbtTypes";
import { formatAutoTitle } from "./formatAutoTitle";

export type MinimalSavePayload = {
  triggerText: string;
  emotion: string;
  automaticThought: string;
  alternativeThought: string;
  cognitiveError?: SelectedCognitiveError | null;
};

export async function saveMinimalPatternAPI(
  accessToken: string,
  payload: MinimalSavePayload,
) {
  const triggerText = payload.triggerText.trim();
  const automaticThought = payload.automaticThought.trim();
  const emotion = payload.emotion.trim();
  const alternativeThought = payload.alternativeThought.trim();
  const errorTitle = payload.cognitiveError?.title?.trim() ?? "";
  const errorDescription = payload.cognitiveError?.detail?.trim() ?? "";

  const res = await fetch("/api/minimal-emotion-note", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeaders(accessToken),
    },
    body: JSON.stringify({
      title: formatAutoTitle(new Date()),
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
  accessToken: string,
  history: SessionHistory,
) {
  const res = await fetch("/api/session-history", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeaders(accessToken),
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
  accessToken: string,
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
  const res = await fetch("/api/deep-session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeaders(accessToken),
    },
    body: JSON.stringify(payload),
  });

  const response = await res.json().catch(() => ({}));
  return { ok: res.ok, payload: response } as {
    ok: boolean;
    payload: { noteId?: number; groupId?: number };
  };
}
