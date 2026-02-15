"use client";

import type { AccessContext } from "@/lib/types/access";
import type {
  EmotionMontage,
  EmotionNote,
  EmotionNoteMiddle,
} from "@/lib/types/emotionNoteTypes";
import { appendQuery, resolveAccess } from "@/lib/api/_helpers";
import { buildApiUrl } from "@/lib/utils/apiBase";

export type EmotionFlowSummary = {
  id: number;
  created_at: string;
  note_count: number;
  title: string;
  description: string | null;
};

export type EmotionFlowDetailMeta = {
  id: number;
  title: string;
  description: string | null;
};

// GET /api/emotion-flow?action=detail&flowId=...&includeMiddles=...
// flow 상세 조회
export const fetchEmotionNoteFlow = async (
  access: AccessContext,
  flowId: number,
  options?: { includeMiddles?: boolean },
) => {
  const resolved = resolveAccess(access);
  if (resolved.kind === "blocked") {
    return {
      response: new Response(null, { status: 401 }),
      data: {
        flow: null as EmotionFlowDetailMeta | null,
        notes: [] as EmotionNote[],
        middles: [] as EmotionNoteMiddle[],
        montages: [] as EmotionMontage[],
      },
    };
  }

  const includeMiddles =
    options?.includeMiddles === undefined ? true : options.includeMiddles;
  const url = appendQuery(buildApiUrl("/api/emotion-flow"), {
    action: "detail",
    flowId: String(flowId),
    includeMiddles: includeMiddles ? "1" : "0",
    ...(resolved.kind === "guest" ? { deviceId: resolved.deviceId } : {}),
  });
  const response = await fetch(url, {
    headers: resolved.kind === "auth" ? resolved.headers : undefined,
  });

  const data = response.ok
    ? ((await response.json()) as {
        flow: EmotionFlowDetailMeta | null;
        notes: EmotionNote[];
        middles: EmotionNoteMiddle[];
        montages: EmotionMontage[];
      })
    : { flow: null, notes: [], middles: [], montages: [] };

  return { response, data };
};

// GET /api/emotion-flow?action=list
// flow 목록 조회
export const fetchEmotionFlowList = async (access: AccessContext) => {
  const resolved = resolveAccess(access);
  if (resolved.kind === "blocked") {
    return {
      response: new Response(null, { status: 401 }),
      data: { flows: [] as EmotionFlowSummary[] },
    };
  }

  const url = appendQuery(buildApiUrl("/api/emotion-flow"), {
    action: "list",
    ...(resolved.kind === "guest" ? { deviceId: resolved.deviceId } : {}),
  });
  const response = await fetch(url, {
    headers: resolved.kind === "auth" ? resolved.headers : undefined,
  });

  const data = response.ok
    ? ((await response.json()) as { flows: EmotionFlowSummary[] })
    : { flows: [] };

  return { response, data };
};
