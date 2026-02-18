"use client";

import type { AccessContext } from "@/lib/types/access";
import { resolveAccess } from "@/lib/api/_helpers";
import { buildApiUrl } from "@/lib/utils/apiBase";

export const upsertBehaviorHistory = async (
  payload: {
    tracked_on: string;
    comments?: string;
    checks: Array<{ check_id: number; is_done: boolean }>;
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

  return fetch(buildApiUrl("/api/emotion-behavior-history"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(resolved.kind === "auth" ? resolved.headers : {}),
    },
    body: JSON.stringify(body),
  });
};
