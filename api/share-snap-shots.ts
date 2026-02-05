import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleCors, methodNotAllowed } from "./_utils.js";
import { handleGetShareSnapshot } from "../src/lib/vercel/share/getShareSnapshot.js";
import { handlePostShareSnapshot } from "../src/lib/vercel/share/postShareSnapshot.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  if (req.method === "GET") {
    return handleGetShareSnapshot(req, res);
  }

  if (req.method === "POST") {
    return handlePostShareSnapshot(req, res);
  }

  return methodNotAllowed(res);
}
