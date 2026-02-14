"use client";

import { buildApiUrl } from "@/lib/utils/apiBase";
import { buildAuthHeaders } from "@/lib/utils/buildAuthHeaders";
import { getDeviceId } from "@/lib/storage/device/deviceId";

// GET /api/device-merge
// device-merge 조회
export const checkDeviceData = async (accessToken: string) => {
  const deviceId = getDeviceId();
  const query = new URLSearchParams({ deviceId }).toString();
  const response = await fetch(buildApiUrl(`/api/device-merge?${query}`), {
    method: "GET",
    headers: {
      ...buildAuthHeaders(accessToken),
    },
  });

  const data = await response.json().catch(() => ({}));
  return {
    response,
    data,
  } as { response: Response; data: { ok?: boolean; hasData?: boolean } };
};
