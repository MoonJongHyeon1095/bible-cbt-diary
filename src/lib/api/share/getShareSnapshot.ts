"use client";

import { buildApiUrl } from "@/lib/utils/apiBase";

export const fetchShareSnapshot = async (shareId: string) => {
  const response = await fetch(
    buildApiUrl(`/api/share-snap-shots?sid=${shareId}`),
  );
  const data = response.ok
    ? ((await response.json()) as {
        share: {
          title: string;
          trigger_text: string;
          sections: Record<string, unknown>;
        } | null;
        message?: string;
      })
    : { share: null, message: "공유 내용을 불러오지 못했습니다." };

  return { response, data };
};
