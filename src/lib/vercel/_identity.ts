import type { VercelRequest } from "@vercel/node";
import { getUserFromAuthHeader } from "../auth/sessionNode.js";
import { getQueryParam, normalizeDeviceId } from "./_utils.js";

export const resolveIdentityFromQuery = async (
  req: VercelRequest,
  key = "deviceId",
) => {
  const user = await getUserFromAuthHeader(req.headers.authorization);
  const deviceId = normalizeDeviceId(getQueryParam(req, key) ?? undefined);
  return { user, deviceId };
};

export const resolveIdentityFromBody = async (
  req: VercelRequest,
  deviceId?: string | null,
) => {
  const user = await getUserFromAuthHeader(req.headers.authorization);
  const normalized = normalizeDeviceId(deviceId ?? undefined);
  return { user, deviceId: normalized };
};
