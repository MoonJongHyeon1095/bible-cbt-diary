"use client";

import type { AccessContext } from "@/lib/types/access";
import { resolveAccess } from "@/lib/api/_helpers";
import { buildApiUrl } from "@/lib/utils/apiBase";

export const deleteBehaviorHistory = async (
  payload: {
    id: number;
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
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...(resolved.kind === "auth" ? resolved.headers : {}),
    },
    body: JSON.stringify(body),
  });
};
