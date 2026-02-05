"use client";

import type { AccessContext } from "@/lib/types/access";
import type { SelectedCognitiveError } from "@/lib/types/cbtTypes";
import { buildApiUrl } from "@/lib/utils/apiBase";
import { resolveAccess } from "@/lib/api/_helpers";

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
    flow_id: number | null;
  },
) {
  const resolved = resolveAccess(access);
  if (resolved.kind === "blocked") {
    return { ok: false, payload: {} as { noteId?: number; flowId?: number } };
  }

  const body = {
    mode: "deep",
    ...payload,
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
    payload: { noteId?: number; flowId?: number };
  };
}
