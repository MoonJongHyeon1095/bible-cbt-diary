"use client";

import type { AccessContext } from "@/lib/types/access";
import { buildApiUrl } from "@/lib/utils/apiBase";
import { appendQuery, resolveAccess } from "@/lib/api/_helpers";

export const hideAllEmotionNotesFromHistory = async (access: AccessContext) => {
  const resolved = resolveAccess(access);
  if (resolved.kind === "blocked") {
    return new Response(null, { status: 401 });
  }

  const url = appendQuery(buildApiUrl("/api/emotion-notes"), {
    action: "hide-all-history",
  });
  const body = resolved.kind === "guest" ? { deviceId: resolved.deviceId } : {};

  return fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(resolved.kind === "auth" ? resolved.headers : {}),
    },
    body: JSON.stringify(body),
  });
};
