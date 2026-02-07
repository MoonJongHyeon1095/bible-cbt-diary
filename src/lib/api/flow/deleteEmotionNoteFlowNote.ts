"use client";

import type { AccessContext } from "@/lib/types/access";
import { appendQuery, resolveAccess } from "@/lib/api/_helpers";
import { buildApiUrl } from "@/lib/utils/apiBase";

// DELETE /api/emotion-flow?action=note
export const deleteEmotionNoteFlowNote = async (
  access: AccessContext,
  payload: { flow_id: number; note_id: number },
) => {
  const resolved = resolveAccess(access);
  if (resolved.kind === "blocked") {
    return {
      response: new Response(null, { status: 401 }),
      data: { ok: false, message: "로그인이 필요합니다." },
    };
  }

  const body =
    resolved.kind === "guest"
      ? { ...payload, deviceId: resolved.deviceId }
      : payload;

  const url = appendQuery(buildApiUrl("/api/emotion-flow"), {
    action: "note",
  });

  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...(resolved.kind === "auth" ? resolved.headers : {}),
    },
    body: JSON.stringify(body),
  });

  const data = response.ok
    ? ((await response.json()) as { ok: boolean; message?: string })
    : ({ ok: false } as { ok: boolean; message?: string });

  return { response, data };
};
