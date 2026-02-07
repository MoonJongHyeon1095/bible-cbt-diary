import type { AccessContext } from "@/lib/types/access";
import { resolveAccess } from "@/lib/api/_helpers";
import { buildApiUrl } from "@/lib/utils/apiBase";

// POST /api/emotion-flow
// emotion-flow 등록
export const postEmotionNoteFlow = async (
  access: AccessContext,
  payload: {
    note_id: number;
    flow_id?: number;
  },
) => {
  const resolved = resolveAccess(access);
  if (resolved.kind === "blocked") {
    return {
      response: new Response(null, { status: 401 }),
      data: { ok: false, message: "로그인이 필요합니다." },
    };
  }

  const body =
    resolved.kind === "guest"
      ? { ...payload, deviceId: resolved.deviceId }
      : payload;

  const response = await fetch(buildApiUrl("/api/emotion-flow"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(resolved.kind === "auth" ? resolved.headers : {}),
    },
    body: JSON.stringify(body),
  });

  const data = response.ok
    ? ((await response.json()) as {
        ok: boolean;
        flowId?: number;
        message?: string;
      })
    : ({ ok: false } as { ok: boolean; flowId?: number; message?: string });

  return { response, data };
};
