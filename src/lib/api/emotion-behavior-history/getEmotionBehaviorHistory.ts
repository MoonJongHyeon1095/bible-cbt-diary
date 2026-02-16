"use client";

import type { AccessContext } from "@/lib/types/access";
import type { EmotionBehaviorHistory } from "@/lib/types/emotionNoteTypes";
import { appendQuery, resolveAccess } from "@/lib/api/_helpers";
import { buildApiUrl } from "@/lib/utils/apiBase";

export const fetchBehaviorHistory = async (
  access: AccessContext,
  options?: {
    behaviorDetailId?: number;
    trackedOn?: string;
  },
) => {
  const resolved = resolveAccess(access);
  if (resolved.kind === "blocked") {
    return {
      response: new Response(null, { status: 401 }),
      data: { histories: [] as EmotionBehaviorHistory[] },
    };
  }

  const query = new URLSearchParams();
  if (options?.behaviorDetailId != null) {
    query.set("behavior_detail_id", String(options.behaviorDetailId));
  }
  if (options?.trackedOn) {
    query.set("tracked_on", options.trackedOn);
  }

  const url = appendQuery(
    buildApiUrl(`/api/emotion-behavior-history${query.toString() ? `?${query.toString()}` : ""}`),
    resolved.kind === "guest" ? { deviceId: resolved.deviceId } : {},
  );
  const response = await fetch(url, {
    headers: resolved.kind === "auth" ? resolved.headers : undefined,
  });

  const data = response.ok
    ? ((await response.json()) as { histories: EmotionBehaviorHistory[] })
    : { histories: [] };

  return { response, data };
};
