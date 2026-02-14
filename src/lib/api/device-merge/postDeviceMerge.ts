"use client";

import { buildApiUrl } from "@/lib/utils/apiBase";
import { buildAuthHeaders } from "@/lib/utils/buildAuthHeaders";
import { getDeviceId } from "@/lib/storage/device/deviceId";

// POST /api/device-merge
// device-merge 등록
export const mergeDeviceData = async (accessToken: string) => {
  const deviceId = getDeviceId();
  const response = await fetch(buildApiUrl("/api/device-merge"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeaders(accessToken),
    },
    body: JSON.stringify({ deviceId }),
  });

  const data = await response.json().catch(() => ({}));
  return { response, data } as { response: Response; data: { ok?: boolean } };
};
