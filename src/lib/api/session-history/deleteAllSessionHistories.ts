"use client";

import type { AccessContext } from "@/lib/types/access";
import { buildApiUrl } from "@/lib/utils/apiBase";
import { resolveAccess } from "@/lib/api/_helpers";

// DELETE /api/session-history
// session-history 삭제
export const deleteAllSessionHistories = async (access: AccessContext) => {
  const resolved = resolveAccess(access);
  if (resolved.kind === "blocked") {
    return { response: new Response(null, { status: 401 }) };
  }

  const body =
    resolved.kind === "guest"
      ? { all: true, deviceId: resolved.deviceId }
      : { all: true };

  const response = await fetch(buildApiUrl("/api/session-history"), {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...(resolved.kind === "auth" ? resolved.headers : {}),
    },
    body: JSON.stringify(body),
  });

  return { response };
};
