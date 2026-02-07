import type { VercelRequest } from "@vercel/node";
import { getUserFromAuthHeader } from "../auth/sessionNode.js";
import { getQueryParam, normalizeDeviceId } from "./_utils.js";

// INTERNAL (no api route)
// api 요청 쿼리 기반 사용자 식별
export const resolveIdentityFromQuery = async (
  req: VercelRequest,
  key = "deviceId",
) => {
  const user = await getUserFromAuthHeader(req.headers.authorization);
  const deviceId = normalizeDeviceId(getQueryParam(req, key) ?? undefined);
  return { user, deviceId };
};

// INTERNAL (no api route)
// api 요청 바디 기반 사용자 식별
export const resolveIdentityFromBody = async (
  req: VercelRequest,
  deviceId?: string | null,
) => {
  const user = await getUserFromAuthHeader(req.headers.authorization);
  const normalized = normalizeDeviceId(deviceId ?? undefined);
  return { user, deviceId: normalized };
};
