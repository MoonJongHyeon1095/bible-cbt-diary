"use client";

import type { AccessContext } from "@/lib/types/access";
import { buildApiUrl } from "@/lib/utils/apiBase";
import { resolveAccess } from "@/lib/api/_helpers";

// DELETE /api/emotion-behavior-details
// emotion-behavior-details 삭제
export const deleteBehaviorDetail = async (
  detailId: number,
  access: AccessContext,
) => {
  const resolved = resolveAccess(access);
  if (resolved.kind === "blocked") {
    return new Response(null, { status: 401 });
  }

  const body =
    resolved.kind === "guest"
      ? { id: detailId, deviceId: resolved.deviceId }
      : { id: detailId };

  return fetch(buildApiUrl("/api/emotion-behavior-details"), {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...(resolved.kind === "auth" ? resolved.headers : {}),
    },
    body: JSON.stringify(body),
  });
};
