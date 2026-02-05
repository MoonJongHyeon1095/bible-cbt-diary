import type { AccessContext } from "@/lib/types/access";
import { buildAuthHeaders } from "@/lib/utils/buildAuthHeaders";
import { getDeviceId } from "@/lib/utils/deviceId";

export type ResolvedAccess =
  | { kind: "auth"; headers: Record<string, string> }
  | { kind: "guest"; deviceId: string }
  | { kind: "blocked" };

export const resolveAccess = (access: AccessContext): ResolvedAccess => {
  if (access.mode === "auth" && access.accessToken) {
    return { kind: "auth", headers: buildAuthHeaders(access.accessToken) };
  }

  if (access.mode === "guest") {
    return { kind: "guest", deviceId: getDeviceId() };
  }

  return { kind: "blocked" };
};

export const appendQuery = (url: string, params: Record<string, string>) => {
  const query = new URLSearchParams(params).toString();
  if (!query) return url;
  return url.includes("?") ? `${url}&${query}` : `${url}?${query}`;
};
