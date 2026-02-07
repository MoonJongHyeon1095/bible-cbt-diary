import { buildApiUrl } from "@/lib/utils/apiBase";
import { buildAuthHeaders } from "@/lib/utils/buildAuthHeaders";

// POST /api/emotion-flow
// emotion-flow 등록
export const postEmotionNoteFlow = async (
  accessToken: string,
  payload: {
    note_id: number;
  },
) => {
  const response = await fetch(buildApiUrl("/api/emotion-flow"), {
    method: "POST",
    headers: buildAuthHeaders(accessToken),
    body: JSON.stringify(payload),
  });

  const data = response.ok
    ? ((await response.json()) as { ok: boolean; flowId?: number })
    : ({ ok: false } as { ok: boolean; flowId?: number });

  return { response, data };
};
