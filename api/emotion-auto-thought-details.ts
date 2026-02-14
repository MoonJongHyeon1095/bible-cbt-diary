import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleCors, methodNotAllowed } from "./_utils.js";
import { handleGetEmotionNoteDetails } from "../src/lib/vercel/emotion-auto-thought-details/getEmotionNoteDetails.js";
import { handlePostEmotionNoteDetails } from "../src/lib/vercel/emotion-auto-thought-details/postEmotionNoteDetails.js";
import { handlePatchEmotionNoteDetails } from "../src/lib/vercel/emotion-auto-thought-details/patchEmotionNoteDetails.js";
import { handleDeleteEmotionNoteDetails } from "../src/lib/vercel/emotion-auto-thought-details/deleteEmotionNoteDetails.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  if (req.method === "GET") {
    return handleGetEmotionNoteDetails(req, res);
  }
  if (req.method === "POST") {
    return handlePostEmotionNoteDetails(req, res);
  }
  if (req.method === "PATCH") {
    return handlePatchEmotionNoteDetails(req, res);
  }
  if (req.method === "DELETE") {
    return handleDeleteEmotionNoteDetails(req, res);
  }

  return methodNotAllowed(res);
}
