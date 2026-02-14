"use client";

import type { AccessContext } from "@/lib/types/access";
import { buildApiUrl } from "@/lib/utils/apiBase";
import { resolveAccess } from "@/lib/api/_helpers";

// PATCH /api/emotion-auto-thought-details
// emotion-auto-thought-details 수정
export const updateThoughtDetail = async (
  payload: { id: number; automatic_thought: string; emotion: string },
  access: AccessContext,
) => {
  const resolved = resolveAccess(access);
  if (resolved.kind === "blocked") {
    return new Response(null, { status: 401 });
  }

  const body =
    resolved.kind === "guest"
      ? { ...payload, deviceId: resolved.deviceId }
      : payload;

  return fetch(buildApiUrl("/api/emotion-auto-thought-details"), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(resolved.kind === "auth" ? resolved.headers : {}),
    },
    body: JSON.stringify(body),
  });
};
