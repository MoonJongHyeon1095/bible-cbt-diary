import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleCors, methodNotAllowed } from "./_utils.js";
import { handleGetEmotionBehaviorDetails } from "../src/lib/vercel/emotion-behavior-details/getEmotionBehaviorDetails.js";
import { handlePostEmotionBehaviorDetails } from "../src/lib/vercel/emotion-behavior-details/postEmotionBehaviorDetails.js";
import { handlePatchEmotionBehaviorDetails } from "../src/lib/vercel/emotion-behavior-details/patchEmotionBehaviorDetails.js";
import { handleDeleteEmotionBehaviorDetails } from "../src/lib/vercel/emotion-behavior-details/deleteEmotionBehaviorDetails.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  if (req.method === "GET") {
    return handleGetEmotionBehaviorDetails(req, res);
  }
  if (req.method === "POST") {
    return handlePostEmotionBehaviorDetails(req, res);
  }
  if (req.method === "PATCH") {
    return handlePatchEmotionBehaviorDetails(req, res);
  }
  if (req.method === "DELETE") {
    return handleDeleteEmotionBehaviorDetails(req, res);
  }

  return methodNotAllowed(res);
}
