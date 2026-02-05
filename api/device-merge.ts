import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleCors, methodNotAllowed } from "./_utils.js";
import { handlePostDeviceMerge } from "../src/lib/vercel/device-merge/postDeviceMerge.js";
import { handleGetDeviceMerge } from "../src/lib/vercel/device-merge/getDeviceMerge.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  if (req.method === "POST") {
    return handlePostDeviceMerge(req, res);
  }
  if (req.method === "GET") {
    return handleGetDeviceMerge(req, res);
  }

  return methodNotAllowed(res);
}
