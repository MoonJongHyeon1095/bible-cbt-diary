import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleCors, methodNotAllowed } from "./_utils.js";
import { handleGetEmotionErrorDetails } from "../src/lib/vercel/emotion-error-details/getEmotionErrorDetails.js";
import { handlePostEmotionErrorDetails } from "../src/lib/vercel/emotion-error-details/postEmotionErrorDetails.js";
import { handlePatchEmotionErrorDetails } from "../src/lib/vercel/emotion-error-details/patchEmotionErrorDetails.js";
import { handleDeleteEmotionErrorDetails } from "../src/lib/vercel/emotion-error-details/deleteEmotionErrorDetails.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  if (req.method === "GET") {
    return handleGetEmotionErrorDetails(req, res);
  }
  if (req.method === "POST") {
    return handlePostEmotionErrorDetails(req, res);
  }
  if (req.method === "PATCH") {
    return handlePatchEmotionErrorDetails(req, res);
  }
  if (req.method === "DELETE") {
    return handleDeleteEmotionErrorDetails(req, res);
  }

  return methodNotAllowed(res);
}
