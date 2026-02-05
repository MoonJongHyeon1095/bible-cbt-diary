import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleCors, getQueryParam, methodNotAllowed } from "./_utils.js";
import { handleGetEmotionNoteFlow } from "../src/lib/vercel/flow/getEmotionNoteFlow.js";
import { handleGetEmotionFlows } from "../src/lib/vercel/flow/getEmotionNoteFlowGroups.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  if (req.method !== "GET") {
    return methodNotAllowed(res);
  }

  const action = getQueryParam(req, "action");
  if (action === "flows") {
    return handleGetEmotionFlows(req, res);
  }

  return handleGetEmotionNoteFlow(req, res);
}
