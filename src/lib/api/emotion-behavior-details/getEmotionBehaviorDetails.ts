"use client";

import type { AccessContext } from "@/lib/types/access";
import type { EmotionNoteBehaviorDetail } from "@/lib/types/emotionNoteTypes";
import { buildApiUrl } from "@/lib/utils/apiBase";
import { appendQuery, resolveAccess } from "@/lib/api/_helpers";

// GET /api/emotion-behavior-details
// emotion-behavior-details 상세 조회
export const fetchBehaviorDetails = async (
  access: AccessContext,
  options?: {
    detailId?: number;
    query?: string;
    sort?: "created_desc" | "recorded_desc";
    limit?: number;
    offset?: number;
    createdFrom?: string;
    createdTo?: string;
    includePinned?: boolean;
  },
) => {
  const resolved = resolveAccess(access);
  if (resolved.kind === "blocked") {
    return {
      response: new Response(null, { status: 401 }),
      data: { details: [] as EmotionNoteBehaviorDetail[] },
    };
  }

  const query = new URLSearchParams();
  if (options?.detailId != null) query.set("detail_id", String(options.detailId));
  if (options?.query) query.set("q", options.query);
  if (options?.sort) query.set("sort", options.sort);
  if (options?.limit != null) query.set("limit", String(options.limit));
  if (options?.offset != null) query.set("offset", String(options.offset));
  if (options?.createdFrom) query.set("created_from", options.createdFrom);
  if (options?.createdTo) query.set("created_to", options.createdTo);
  if (options?.includePinned) query.set("include_pinned", "true");

  const url = appendQuery(
    buildApiUrl(`/api/emotion-behavior-details${query.toString() ? `?${query.toString()}` : ""}`),
    resolved.kind === "guest" ? { deviceId: resolved.deviceId } : {},
  );

  const response = await fetch(url, {
    headers: resolved.kind === "auth" ? resolved.headers : undefined,
  });

  const data = response.ok
    ? ((await response.json()) as {
        details: EmotionNoteBehaviorDetail[];
        total?: number;
        limit?: number;
        offset?: number;
      })
    : { details: [], total: 0, limit: 0, offset: 0 };
  return { response, data };
};
