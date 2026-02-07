"use client";

import type { AccessContext } from "@/lib/types/access";
import { buildApiUrl } from "@/lib/utils/apiBase";
import { resolveAccess } from "@/lib/api/_helpers";

// PATCH /api/emotion-notes
// emotion-notes 수정
export const updateEmotionNote = async (
  payload: { id: number; title?: string; trigger_text?: string },
  access: AccessContext,
): Promise<{
  response: Response;
  data: { ok: boolean; message?: string; noteId?: number | null };
}> => {
  const resolved = resolveAccess(access);
  if (resolved.kind === "blocked") {
    return {
      response: new Response(null, { status: 401 }),
      data: { ok: false, noteId: null },
    };
  }

  const body =
    resolved.kind === "guest"
      ? { ...payload, deviceId: resolved.deviceId }
      : payload;

  const response = await fetch(buildApiUrl("/api/emotion-notes"), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(resolved.kind === "auth" ? resolved.headers : {}),
    },
    body: JSON.stringify(body),
  });

  const data = (await response.json()) as {
    ok: boolean;
    message?: string;
    noteId?: number | null;
  };

  return { response, data };
};
