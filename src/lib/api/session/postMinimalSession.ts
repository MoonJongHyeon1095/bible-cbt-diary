"use client";

import type { AccessContext } from "@/lib/types/access";
import type { SdtKey } from "@/lib/constants/sdt";
import type { SelectedCognitiveError } from "@/lib/types/sessionTypes";
import { buildApiUrl } from "@/lib/utils/apiBase";
import { resolveAccess } from "@/lib/api/_helpers";
import { buildSessionNoteTitle } from "@/components/session/utils/buildSessionNoteTitle";

export type MinimalSavePayload = {
  title: string;
  triggerText: string;
  emotion: string;
  emotions?: string[];
  emotionType?: "positive" | "negative";
  automaticThought: string;
  alternativeThought?: string;
  cognitiveError?: SelectedCognitiveError | null;
  sdtType?: SdtKey | null;
  sdtEmpathyText?: string;
  reflectionQuestion?: string;
  behaviorLabel?: string;
  behaviorDescription?: string;
  behaviorChecklist?: string[];
};

// POST /api/session
// session 등록
export async function saveMinimalPatternAPI(
  access: AccessContext,
  payload: MinimalSavePayload,
) {
  const resolved = resolveAccess(access);
  if (resolved.kind === "blocked") {
    return { ok: false, payload: {} as { noteId?: number | string } };
  }

  const triggerText = payload.triggerText.trim();
  const automaticThought = payload.automaticThought.trim();
  const emotion = payload.emotion.trim();
  const emotions = Array.isArray(payload.emotions)
    ? payload.emotions
        .map((value) => String(value).trim())
        .filter((value) => value.length > 0)
        .slice(0, 2)
    : [];
  const alternativeThought = String(payload.alternativeThought ?? "").trim();
  const emotionType = payload.emotionType === "positive" ? "positive" : "negative";
  const title =
    payload.title.trim() ||
    buildSessionNoteTitle({ emotion, incident: triggerText });
  const errorTitle = payload.cognitiveError?.title?.trim() ?? "";
  const errorDescription = payload.cognitiveError?.detail?.trim() ?? "";

  const body = {
    mode: "minimal",
    title,
    triggerText,
    emotion,
    emotions,
    emotionType,
    automaticThought,
    alternativeThought,
    cognitiveError: errorTitle
      ? { title: errorTitle, detail: errorDescription }
      : null,
    sdtType: payload.sdtType ?? null,
    sdtEmpathyText: String(payload.sdtEmpathyText ?? "").trim(),
    reflectionQuestion: String(payload.reflectionQuestion ?? "").trim(),
    behaviorLabel: String(payload.behaviorLabel ?? "").trim(),
    behaviorDescription: String(payload.behaviorDescription ?? "").trim(),
    behaviorChecklist: Array.isArray(payload.behaviorChecklist)
      ? payload.behaviorChecklist
          .map((item) => String(item ?? "").trim())
          .filter((item) => item.length > 0)
          .slice(0, 3)
      : [],
    ...(resolved.kind === "guest" ? { deviceId: resolved.deviceId } : {}),
  };

  const res = await fetch(buildApiUrl("/api/session"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(resolved.kind === "auth" ? resolved.headers : {}),
    },
    body: JSON.stringify(body),
  });

  const response = await res.json().catch(() => ({}));
  return { ok: res.ok, payload: response } as {
    ok: boolean;
    payload: { noteId?: number | string };
  };
}
