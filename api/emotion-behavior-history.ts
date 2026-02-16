import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleCors, methodNotAllowed } from "./_utils.js";
import { handleGetEmotionBehaviorHistory } from "../src/lib/vercel/emotion-behavior-history/getEmotionBehaviorHistory.js";
import { handlePostEmotionBehaviorHistory } from "../src/lib/vercel/emotion-behavior-history/postEmotionBehaviorHistory.js";
import { handlePatchEmotionBehaviorHistory } from "../src/lib/vercel/emotion-behavior-history/patchEmotionBehaviorHistory.js";
import { handleDeleteEmotionBehaviorHistory } from "../src/lib/vercel/emotion-behavior-history/deleteEmotionBehaviorHistory.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  if (req.method === "GET") {
    return handleGetEmotionBehaviorHistory(req, res);
  }
  if (req.method === "POST") {
    return handlePostEmotionBehaviorHistory(req, res);
  }
  if (req.method === "PATCH") {
    return handlePatchEmotionBehaviorHistory(req, res);
  }
  if (req.method === "DELETE") {
    return handleDeleteEmotionBehaviorHistory(req, res);
  }

  return methodNotAllowed(res);
}
