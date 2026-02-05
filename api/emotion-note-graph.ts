import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleCors, getQueryParam, methodNotAllowed } from "./_utils.js";
import { handleGetEmotionNoteGraph } from "../src/lib/vercel/graph/getEmotionNoteGraph.js";
import { handleGetEmotionNoteGraphGroups } from "../src/lib/vercel/graph/getEmotionNoteGraphGroups.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  if (req.method !== "GET") {
    return methodNotAllowed(res);
  }

  const action = getQueryParam(req, "action");
  if (action === "groups") {
    return handleGetEmotionNoteGraphGroups(req, res);
  }

  return handleGetEmotionNoteGraph(req, res);
}
