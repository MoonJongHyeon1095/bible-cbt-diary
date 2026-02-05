import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleCors, methodNotAllowed } from "./_utils.js";
import { handleGetTokenUsageStatus } from "../src/lib/vercel/token-usage/getTokenUsageStatus.js";
import { handlePostTokenUsage } from "../src/lib/vercel/token-usage/postTokenUsage.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  if (req.method === "GET") {
    return handleGetTokenUsageStatus(req, res);
  }

  if (req.method === "POST") {
    return handlePostTokenUsage(req, res);
  }

  return methodNotAllowed(res);
}
