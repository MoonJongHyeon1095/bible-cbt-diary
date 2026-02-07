"use client";

import type { AccessContext } from "@/lib/types/access";
import { buildApiUrl } from "@/lib/utils/apiBase";
import { resolveAccess } from "@/lib/api/_helpers";

// POST /api/emotion-behavior-details
// emotion-behavior-details 등록
export const createBehaviorDetail = async (
  payload: {
    note_id: number;
    behavior_label: string;
    behavior_description: string;
    error_tags?: string[] | null;
  },
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

  return fetch(buildApiUrl("/api/emotion-behavior-details"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(resolved.kind === "auth" ? resolved.headers : {}),
    },
    body: JSON.stringify(body),
  });
};
