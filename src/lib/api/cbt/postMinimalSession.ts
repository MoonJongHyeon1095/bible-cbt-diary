"use client";

import type { AccessContext } from "@/lib/types/access";
import type { SelectedCognitiveError } from "@/lib/types/cbtTypes";
import { buildApiUrl } from "@/lib/utils/apiBase";
import { resolveAccess } from "@/lib/api/_helpers";
import { formatAutoTitle } from "@/components/cbt/utils/formatAutoTitle";

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
  const resolved = resolveAccess(access);
  if (resolved.kind === "blocked") {
    return { ok: false, payload: {} as { noteId?: number | string } };
  }

  const triggerText = payload.triggerText.trim();
  const automaticThought = payload.automaticThought.trim();
  const emotion = payload.emotion.trim();
  const alternativeThought = payload.alternativeThought.trim();
  const errorTitle = payload.cognitiveError?.title?.trim() ?? "";
  const errorDescription = payload.cognitiveError?.detail?.trim() ?? "";

  const body = {
    mode: "minimal",
    title: formatAutoTitle(new Date(), emotion),
    triggerText,
    emotion,
    automaticThought,
    alternativeThought,
    cognitiveError: errorTitle
      ? { title: errorTitle, detail: errorDescription }
      : null,
    ...(resolved.kind === "guest" ? { deviceId: resolved.deviceId } : {}),
  };

  const res = await fetch(buildApiUrl("/api/deep-session"), {
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
