import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleCors, methodNotAllowed } from "./_utils.js";
import { handleGetEmotionAlternativeDetails } from "../src/lib/vercel/emotion-alternative-details/getEmotionAlternativeDetails.js";
import { handlePostEmotionAlternativeDetails } from "../src/lib/vercel/emotion-alternative-details/postEmotionAlternativeDetails.js";
import { handlePatchEmotionAlternativeDetails } from "../src/lib/vercel/emotion-alternative-details/patchEmotionAlternativeDetails.js";
import { handleDeleteEmotionAlternativeDetails } from "../src/lib/vercel/emotion-alternative-details/deleteEmotionAlternativeDetails.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  if (req.method === "GET") {
    return handleGetEmotionAlternativeDetails(req, res);
  }
  if (req.method === "POST") {
    return handlePostEmotionAlternativeDetails(req, res);
  }
  if (req.method === "PATCH") {
    return handlePatchEmotionAlternativeDetails(req, res);
  }
  if (req.method === "DELETE") {
    return handleDeleteEmotionAlternativeDetails(req, res);
  }

  return methodNotAllowed(res);
}
