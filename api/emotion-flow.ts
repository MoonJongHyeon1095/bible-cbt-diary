import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleGetEmotionNoteFlow } from "../src/lib/vercel/flow/getEmotionNoteFlow.js";
import { handleGetEmotionFlowList } from "../src/lib/vercel/flow/getEmotionNoteFlowList.js";
import { handlePostEmotionNoteFlow } from "../src/lib/vercel/flow/postEmotionNoteFlow.js";
import { handleDeleteEmotionNoteFlow } from "../src/lib/vercel/flow/deleteEmotionNoteFlow.js";
import {
  getQueryParam,
  handleCors,
  methodNotAllowed,
  readJson,
} from "./_utils.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  if (req.method === "POST") {
    const payload = await readJson(req);
    return handlePostEmotionNoteFlow(req, res, payload);
  }

  if (req.method === "GET") {
    const action = getQueryParam(req, "action");
    if (action === "list") {
      return handleGetEmotionFlowList(req, res);
    }

    if (action === "detail") {
      return handleGetEmotionNoteFlow(req, res);
    }
  }

  if (req.method === "DELETE") {
    return handleDeleteEmotionNoteFlow(req, res);
  }

  return methodNotAllowed(res);
}
