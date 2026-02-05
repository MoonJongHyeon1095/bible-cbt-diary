"use client";

import { buildApiUrl } from "@/lib/utils/apiBase";
import { buildAuthHeaders } from "@/lib/utils/buildAuthHeaders";

export const createShareSnapshot = async (params: {
  accessToken: string;
  noteId: number;
  selectedThoughtIds: number[];
  selectedErrorIds: number[];
  selectedAlternativeIds: number[];
  selectedBehaviorIds: number[];
}) => {
  const response = await fetch(buildApiUrl("/api/share-snap-shots"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeaders(params.accessToken),
    },
    body: JSON.stringify({
      noteId: params.noteId,
      selectedThoughtIds: params.selectedThoughtIds,
      selectedErrorIds: params.selectedErrorIds,
      selectedAlternativeIds: params.selectedAlternativeIds,
      selectedBehaviorIds: params.selectedBehaviorIds,
    }),
  });

  const data = response.ok
    ? ((await response.json()) as {
        ok: boolean;
        publicId?: string;
        message?: string;
      })
    : { ok: false, message: "공유 링크 생성에 실패했습니다." };

  return { response, data };
};
